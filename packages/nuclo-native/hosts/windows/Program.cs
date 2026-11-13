// nuclo-native host for Windows: WPF controls driven by Jint.
using System.IO;
using System.Text.Json;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
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

static class Program
{
    static readonly Dictionary<int, FrameworkElement> Views = new();
    static readonly Engine Js = new();

    [STAThread]
    static void Main()
    {
        var root = new FlexPanel();
        Views[1] = root;
        var window = new Window
        {
            Title = "nuclo-native",
            Width = 420,
            Height = 640,
            Content = new ScrollViewer { Content = root, VerticalScrollBarVisibility = ScrollBarVisibility.Auto },
        };

        Js.SetValue("__nuclo_host", new Action<string>(json =>
        {
            using var ops = JsonDocument.Parse(json);
            foreach (var op in ops.RootElement.EnumerateArray()) Apply(op);
        }));
        Js.Execute(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "app.js")));

        new Application().Run(window);
    }

    static void Emit(int id, string type, object? value = null)
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
                    _ => new FlexPanel(),
                };
                Views[id].Uid = id.ToString();
                break;

            case "insert":
                var parent = (Panel)Views[id];
                var child = Views[op[2].GetInt32()];
                (child.Parent as Panel)?.Children.Remove(child);
                var before = op[3].GetInt32();
                parent.Children.Insert(before == 0 ? parent.Children.Count : parent.Children.IndexOf(Views[before]), child);
                break;

            case "remove":
                (Views[id].Parent as Panel)?.Children.Remove(Views[id]);
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

    static void Forget(FrameworkElement view)
    {
        if (view is Panel panel) foreach (FrameworkElement child in panel.Children) Forget(child);
        Views.Remove(int.Parse(view.Uid));
    }

    static void Set(FrameworkElement view, string key, JsonElement value)
    {
        var text = value.ValueKind == JsonValueKind.String ? value.GetString()! : "";
        if (key == "text" && view is TextBlock label) label.Text = text;
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
