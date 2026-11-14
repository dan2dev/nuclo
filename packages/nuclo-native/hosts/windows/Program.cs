// nuclo-native host for Windows: WPF controls driven by Jint.
using System.IO;
using System.Text.Json;
using System.Windows;
using System.Windows.Automation;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Media.Imaging;
using Jint;

/// <summary>A flex container: direction, gap, alignItems, and per-child flex grow (in Tag).</summary>
class FlexPanel : Panel
{
    public bool Row;
    public double Gap;
    public string Align = "stretch";

    double Main(Size s) => Row ? s.Width : s.Height;
    double Cross(Size s) => Row ? s.Height : s.Width;
    Size Sized(double main, double cross) => Row ? new Size(main, cross) : new Size(cross, main);
    double Gaps => Gap * Math.Max(0, InternalChildren.Count - 1);
    static double Flex(UIElement child) => ((FrameworkElement)child).Tag as double? ?? 0;

    protected override Size MeasureOverride(Size available)
    {
        double main = Gaps, cross = 0;
        foreach (UIElement child in InternalChildren)
        {
            child.Measure(Sized(double.PositiveInfinity, Cross(available)));
            main += Main(child.DesiredSize);
            cross = Math.Max(cross, Cross(child.DesiredSize));
        }
        return Sized(main, cross);
    }

    protected override Size ArrangeOverride(Size final)
    {
        double used = Gaps, grow = 0, position = 0;
        foreach (UIElement child in InternalChildren)
        {
            used += Main(child.DesiredSize);
            grow += Flex(child);
        }
        var free = Math.Max(0, Main(final) - used);
        foreach (UIElement child in InternalChildren)
        {
            var main = Main(child.DesiredSize) + (grow > 0 ? free * Flex(child) / grow : 0);
            var cross = Align == "stretch" ? Cross(final) : Cross(child.DesiredSize);
            var offset = Align == "center" ? (Cross(final) - cross) / 2 : Align == "flex-end" ? Cross(final) - cross : 0;
            child.Arrange(Row ? new Rect(position, offset, main, cross) : new Rect(offset, position, cross, main));
            position += main + Gap;
        }
        return final;
    }
}

/// <summary>One page of a stack: its children stack vertically and scroll.</summary>
class Screen : ScrollViewer
{
    public readonly FlexPanel Body = new();
    public readonly TranslateTransform Shift = new();
    public Stack? Owner;
    public string Title = "";

    public Screen(FrameworkElement body)
    {
        Content = Body;
        VerticalScrollBarVisibility = ScrollBarVisibility.Auto;
        RenderTransform = Shift;
        // The page colour is the body's backgroundColor.
        SetBinding(BackgroundProperty, new Binding(nameof(Panel.Background)) { Source = body });
    }
}

/// <summary>A navigation stack: back button and page title over the top screen.</summary>
class Stack : DockPanel
{
    static readonly FontFamily Icons = new("Segoe Fluent Icons, Segoe MDL2 Assets");
    static readonly Dictionary<string, string> Glyphs = new() { ["chart"] = "\uE9D2", ["photo"] = "\uE91B", ["person"] = "\uE77B" };

    /// <summary>The screens JS wants, bottom to top (insert/remove ops).</summary>
    public readonly List<Screen> Screens = new();
    /// <summary>The screens the user sees; Sync() catches up with Screens.</summary>
    readonly List<Screen> shown = new();
    readonly Grid pages = new() { ClipToBounds = true };
    readonly Button back = new() { Width = 36, Height = 36, Padding = new Thickness(0), Margin = new Thickness(0, 0, 8, 0), Background = Brushes.Transparent, BorderBrush = Brushes.Transparent, ToolTip = "Back", Visibility = Visibility.Collapsed };
    readonly TextBlock title = new() { FontSize = 28, FontWeight = FontWeights.SemiBold, VerticalAlignment = VerticalAlignment.Center };
    Screen? current;
    public Tabs? Owner;

    /// <summary>This stack's item in the tabs' navigation pane.</summary>
    public readonly ListBoxItem Item = new() { Height = 36, Padding = new Thickness(0), Margin = new Thickness(0, 2, 0, 2), VerticalContentAlignment = VerticalAlignment.Center };
    public readonly TextBlock Label = new() { VerticalAlignment = VerticalAlignment.Center };
    readonly TextBlock glyph = new() { FontFamily = Icons, FontSize = 16, Margin = new Thickness(0, 0, 14, 0), VerticalAlignment = VerticalAlignment.Center };
    public string Icon { set => glyph.Text = Glyphs.GetValueOrDefault(value, ""); }

    public Stack()
    {
        back.Content = new TextBlock { Text = "\uE72B", FontFamily = Icons, FontSize = 16 };
        AutomationProperties.SetName(back, "Back");
        back.Click += (_, _) => GoBack();
        var header = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(16, 12, 16, 4), Children = { back, title } };
        SetDock(header, Dock.Top);
        Children.Add(header);
        Children.Add(pages);

        // Settings-style item: glyph + label, an accent pill while selected.
        var pill = new Border { Width = 3, Height = 16, CornerRadius = new CornerRadius(1.5), HorizontalAlignment = HorizontalAlignment.Left };
        pill.SetResourceReference(Border.BackgroundProperty, "AccentFillColorDefaultBrush");
        pill.SetBinding(VisibilityProperty, new Binding(nameof(ListBoxItem.IsSelected)) { Source = Item, Converter = new BooleanToVisibilityConverter() });
        Item.SetValue(Border.CornerRadiusProperty, new CornerRadius(4));
        Item.Content = new Grid
        {
            Children = { pill, new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(14, 0, 0, 0), Children = { glyph, Label } } },
        };
    }

    /// <summary>End of a batch: new top = push, shown top gone = pop, else swap.</summary>
    public void Sync()
    {
        var top = Screens.LastOrDefault();
        var was = shown.LastOrDefault();
        if (top != was) Show(top, top is null || was is null ? 0 : !shown.Contains(top) ? 1 : !Screens.Contains(was) ? -1 : 0);
        shown.Clear();
        shown.AddRange(Screens);
        Refresh();
    }

    /// <summary>The user went back: pop natively, then tell JS (its remove op then finds nothing to do).</summary>
    public bool GoBack()
    {
        if (shown.Count < 2) return false;
        shown.RemoveAt(shown.Count - 1);
        Show(shown[^1], -1);
        Refresh();
        Program.Emit(int.Parse(Uid), "pop", shown.Count);
        return true;
    }

    void Refresh()
    {
        title.Text = shown.LastOrDefault()?.Title ?? "";
        back.Visibility = shown.Count > 1 ? Visibility.Visible : Visibility.Collapsed;
    }

    /// <summary>WinUI drill-in: the new page slides 40px and fades in (dir 1 from the right, -1 from the left).</summary>
    void Show(Screen? next, int dir)
    {
        current = next;
        foreach (var page in pages.Children.Cast<Screen>().Where(page => page != next).ToList())
        {
            if (dir == 0) { pages.Children.Remove(page); continue; }
            page.IsHitTestVisible = false;
            var fade = new DoubleAnimation(0, TimeSpan.FromMilliseconds(150));
            fade.Completed += (_, _) => { if (page != current) pages.Children.Remove(page); };
            page.BeginAnimation(OpacityProperty, fade);
        }
        if (next is null) return;
        if (next.Parent != pages)
        {
            (next.Parent as Panel)?.Children.Remove(next);
            pages.Children.Add(next);
        }
        next.IsHitTestVisible = true;
        var ease = new ExponentialEase { EasingMode = EasingMode.EaseOut, Exponent = 7 };
        var time = TimeSpan.FromMilliseconds(300);
        next.BeginAnimation(OpacityProperty, dir == 0 ? null : new DoubleAnimation(0, 1, time) { EasingFunction = ease });
        next.Shift.BeginAnimation(TranslateTransform.XProperty, dir == 0 ? null : new DoubleAnimation(40 * dir, 0, time) { EasingFunction = ease });
    }
}

/// <summary>Settings-app layout: a navigation pane of stacks on the left, the selected stack on the right.</summary>
class Tabs : Grid
{
    public readonly List<Stack> Stacks = new();
    /// <summary>The index JS selected; applied at the end of the batch, once the stacks exist.</summary>
    public int Selected;
    readonly ListBox nav = new() { Background = Brushes.Transparent, BorderThickness = new Thickness(0), Margin = new Thickness(4, 8, 4, 8) };
    readonly Border page = new();
    public Stack? Current => page.Child as Stack;

    public Tabs()
    {
        ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(240) });
        ColumnDefinitions.Add(new ColumnDefinition());
        SetColumn(page, 1);
        Children.Add(nav);
        Children.Add(page);
        // A subtle fill under the selected item, like Settings (Fluent's default is accent at 40%).
        nav.Resources["ListBoxItemSelectedBackgroundThemeBrush"] = new SolidColorBrush(Color.FromArgb(0x18, 0x80, 0x80, 0x80));
        nav.Resources["ListBoxItemSelectedBackgroundPointerOverThemeBrush"] = new SolidColorBrush(Color.FromArgb(0x10, 0x80, 0x80, 0x80));
        nav.SelectionChanged += (_, _) =>
        {
            page.Child = nav.SelectedIndex < 0 ? null : Stacks[nav.SelectedIndex];
            if (!Program.Batching && nav.SelectedIndex >= 0) Program.Emit(int.Parse(Uid), "select", nav.SelectedIndex);
        };
    }

    public void Insert(Stack stack, FrameworkElement? before)
    {
        var index = before is Stack ahead ? Stacks.IndexOf(ahead) : Stacks.Count;
        Stacks.Insert(index, stack);
        nav.Items.Insert(index, stack.Item);
        stack.Owner = this;
    }

    public void Remove(Stack stack)
    {
        Stacks.Remove(stack);
        nav.Items.Remove(stack.Item);
        stack.Owner = null;
    }

    public void Sync()
    {
        if (Selected < Stacks.Count && nav.SelectedIndex != Selected) nav.SelectedIndex = Selected;
    }
}

static class Program
{
    static readonly Dictionary<int, FrameworkElement> Views = new();
    static readonly Engine Js = new();
    static Window Win = null!;
    static ScrollViewer RootScroll = null!;
    /// <summary>True while a JS batch is applied: selection changes then are programmatic, not the user's.</summary>
    internal static bool Batching;

    [STAThread]
    static void Main()
    {
#pragma warning disable WPF0001 // ThemeMode is experimental
        var app = new Application { ThemeMode = ThemeMode.System };
#pragma warning restore WPF0001
        var root = new FlexPanel();
        Views[1] = root;
        Win = new Window
        {
            Title = "nuclo-native",
            Width = 420,
            Height = 640,
            Content = RootScroll = new ScrollViewer { Content = root, VerticalScrollBarVisibility = ScrollBarVisibility.Auto },
        };
        // Back: Alt+Left and the mouse back button, like any Windows app.
        Win.PreviewKeyDown += (_, e) => { if (e.SystemKey == Key.Left && Keyboard.Modifiers == ModifierKeys.Alt) e.Handled = Back(); };
        Win.PreviewMouseDown += (_, e) => { if (e.ChangedButton == MouseButton.XButton1) e.Handled = Back(); };

        Js.SetValue("__nuclo_host", new Action<string>(json =>
        {
            using var ops = JsonDocument.Parse(json);
            Batching = true;
            foreach (var op in ops.RootElement.EnumerateArray()) Apply(op);
            foreach (var view in Views.Values)
            {
                if (view is Stack stack) stack.Sync();
                else if (view is Tabs tabs) tabs.Sync();
            }
            Batching = false;
        }));
        Js.Execute(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "app.js")));

        app.Run(Win);
    }

    /// <summary>The stack the user is looking at goes back one screen.</summary>
    static bool Back() => (Win.Content as Stack ?? (Win.Content as Tabs)?.Current)?.GoBack() == true;

    internal static void Emit(int id, string type, object? value = null)
    {
        if (value is null) Js.Invoke("__nuclo_event", id, type);
        else Js.Invoke("__nuclo_event", id, type, value);
    }

    static double Px(string value) => double.Parse(value.Replace("px", ""), System.Globalization.CultureInfo.InvariantCulture);
    static Brush Color(string value) => (Brush)new BrushConverter().ConvertFromString(value)!;

    static void Apply(JsonElement op)
    {
        var id = op[1].GetInt32();
        switch (op[0].GetString())
        {
            case "create":
                Views[id] = op[2].GetString() switch
                {
                    "text" => new TextBlock { TextWrapping = TextWrapping.Wrap },
                    "button" => new Button { Padding = new Thickness(12, 4, 12, 4) },
                    "input" => new TextBox { Padding = new Thickness(4) },
                    "checkbox" => new CheckBox(),
                    "image" => new Image { Stretch = Stretch.UniformToFill, ClipToBounds = true },
                    "screen" => new Screen(Views[1]),
                    "stack" => new Stack(),
                    "tabs" => new Tabs(),
                    _ => new FlexPanel(),
                };
                Views[id].Uid = id.ToString();
                break;

            case "insert":
                var child = Views[op[2].GetInt32()];
                var before = Views.GetValueOrDefault(op[3].GetInt32()); // null: append
                Detach(child);
                if (Views[id] is Stack stack && child is Screen screen)
                {
                    stack.Screens.Insert(before is Screen ahead ? stack.Screens.IndexOf(ahead) : stack.Screens.Count, screen);
                    screen.Owner = stack;
                }
                else if (Views[id] is Tabs tabs && child is Stack tab) tabs.Insert(tab, before);
                else if (id == 1 && child is Stack or Tabs)
                {
                    Win.Content = child;
                    if (child is Tabs) Win.Width += 240; // room for the navigation pane
                }
                else
                {
                    var parent = Views[id] is Screen page ? page.Body : (Panel)Views[id];
                    parent.Children.Insert(before is null ? parent.Children.Count : parent.Children.IndexOf(before), child);
                }
                break;

            case "remove":
                Detach(Views[id]);
                Forget(Views[id]);
                break;

            case "set":
                Set(Views[id], op[2].GetString()!, op[3]);
                break;

            case "style":
                Style(Views[id], op[2].GetString()!, op[3].GetString()!);
                break;

            case "listen":
                Listen(Views[id], id, op[2].GetString()!);
                break;
        }
    }

    /// <summary>Takes a view out of its parent. A screen leaves only the stack's model: Sync() animates it away.</summary>
    static void Detach(FrameworkElement view)
    {
        if (view is Screen screen) screen.Owner?.Screens.Remove(screen);
        else if (view is Stack stack) stack.Owner?.Remove(stack);
        else (view.Parent as Panel)?.Children.Remove(view);
        if (Win.Content == view) Win.Content = RootScroll;
    }

    static void Forget(FrameworkElement view)
    {
        IEnumerable<FrameworkElement> children = view switch
        {
            Screen screen => screen.Body.Children.Cast<FrameworkElement>(),
            Stack stack => stack.Screens,
            Tabs tabs => tabs.Stacks,
            Panel panel => panel.Children.Cast<FrameworkElement>(),
            _ => [],
        };
        foreach (var child in children) Forget(child);
        Views.Remove(int.Parse(view.Uid));
    }

    static void Set(FrameworkElement view, string key, JsonElement value)
    {
        var text = value.ValueKind == JsonValueKind.String ? value.GetString()! : "";
        if (key == "title" && view is Screen screen) screen.Title = text;
        else if (key == "title" && view is Stack stack) stack.Label.Text = text;
        else if (key == "icon" && view is Stack tab) tab.Icon = text;
        else if (key == "selected" && view is Tabs tabs) tabs.Selected = int.Parse(value.ToString());
        else if (key == "text" && view is TextBlock label) label.Text = text;
        else if (key == "text" && view is Button button) button.Content = text;
        else if (key == "value" && view is TextBox box && box.Text != text) box.Text = text;
        else if (key == "checked" && view is CheckBox check) check.IsChecked = value.ValueKind == JsonValueKind.True;
        // Asset paths are relative to the bundle.
        else if (key == "src" && view is Image image) image.Source = new BitmapImage(new Uri(Path.Combine(AppContext.BaseDirectory, text)));
        else if (key == "disabled") view.IsEnabled = value.ValueKind != JsonValueKind.True;
    }

    static void Style(FrameworkElement view, string key, string value)
    {
        var flex = view as FlexPanel;
        var control = view as Control;
        var label = view as TextBlock;
        switch (key)
        {
            case "flexDirection" when flex is not null: flex.Row = value == "row"; flex.InvalidateMeasure(); break;
            case "gap" when flex is not null: flex.Gap = Px(value); flex.InvalidateMeasure(); break;
            case "alignItems" when flex is not null: flex.Align = value; flex.InvalidateArrange(); break;
            case "flex": view.Tag = Px(value); (view.Parent as UIElement)?.InvalidateArrange(); break;
            case "opacity": view.Opacity = Px(value); break;
            case "width": view.Width = Px(value); break;
            case "height": view.Height = Px(value); break;
            case "textAlign" when label is not null: label.TextAlignment = value == "center" ? TextAlignment.Center : TextAlignment.Left; break;
            // A Panel has no Padding; with no border a margin looks the same.
            case "padding" when control is not null: control.Padding = new Thickness(Px(value)); break;
            case "padding" when label is not null: label.Padding = new Thickness(Px(value)); break;
            case "padding": view.Margin = new Thickness(Px(value)); break;
            case "backgroundColor" when control is not null: control.Background = Color(value); break;
            case "backgroundColor" when flex is not null: flex.Background = Color(value); break;
            case "backgroundColor" when label is not null: label.Background = Color(value); break;
            case "color" when control is not null: control.Foreground = Color(value); break;
            case "color" when label is not null: label.Foreground = Color(value); break;
            case "fontSize" when control is not null: control.FontSize = Px(value); break;
            case "fontSize" when label is not null: label.FontSize = Px(value); break;
            case "fontWeight" when control is not null: control.FontWeight = value == "bold" ? FontWeights.Bold : FontWeights.Normal; break;
            case "fontWeight" when label is not null: label.FontWeight = value == "bold" ? FontWeights.Bold : FontWeights.Normal; break;
        }
    }

    static void Listen(FrameworkElement view, int id, string type)
    {
        if (type == "click" && view is Button button) button.Click += (_, _) => Emit(id, type);
        else if (type == "click") view.MouseLeftButtonUp += (_, _) => Emit(id, type);
        else if (type == "input" && view is TextBox box) box.TextChanged += (_, _) => Emit(id, type, box.Text);
        else if (type == "change" && view is CheckBox check) check.Click += (_, _) => Emit(id, type, check.IsChecked == true);
        else if (type == "change") view.KeyDown += (_, e) => { if (e.Key == Key.Enter) Emit(id, type); };
    }
}
