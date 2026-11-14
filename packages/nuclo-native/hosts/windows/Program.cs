// nuclo-native host for Windows: WPF controls driven by Jint.
// JS lays everything out (src/layout.ts): this host places views at the frames it sends,
// measures text and draws it itself (TextFormatter, the bundled Inter) at the contract's baselines.
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Windows;
using System.Windows.Automation;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Media.Imaging;
using System.Windows.Media.TextFormatting;
using System.Windows.Threading;
using Jint;
using static System.FormattableString;

/// <summary>Where JS put a view (Tag of every placed element).</summary>
class Place
{
    /// <summary>The frame JS sent, relative to the parent's.</summary>
    public Rect Layout;
    /// <summary>The frame applied: edges on device pixels, relative to the parent's snapped origin.</summary>
    public Rect Frame;
    /// <summary>Unsnapped minus snapped origin: texts draw from where JS put the box.</summary>
    public Vector Offset;
    /// <summary>An input's text inset (its padding op: padding plus border).</summary>
    public Thickness Inset;

    public static Place Of(FrameworkElement view) => (Place)(view.Tag ??= new Place());
}

/// <summary>
/// Every nuclo view: a container (children at the frames JS sent), a text, an image, or a button's label.
/// It paints its background, image (cover) and border inside its rounded corners, then its text; it clips its children
/// (to the same rounded corners) only for overflow "hidden". Borders and padding never move children: JS placed them.
/// </summary>
class View : Panel
{
    /// <summary>A layout root's laid-out size (the frame op): a screen's content scrolls to its height.</summary>
    public Size? Content;
    /// <summary>A layout root reports its size (resize).</summary>
    public Action<Size>? Resized;
    public double Radius;
    /// <summary>overflow "hidden": children are clipped to the rounded box.</summary>
    public bool Clips;
    /// <summary>borderWidth, drawn inside the frame (CSS border-box), in StrokeBrush (black by default).</summary>
    public Thickness Stroke;
    public Brush? StrokeBrush;
    public ImageSource? Image;
    /// <summary>Text views and button labels: their text, font, colour, alignment and inset (padding plus border).</summary>
    public string? Text;
    public Font Font = new();
    public Brush? Color;
    public string Align = "left";
    public Thickness Pad;
    /// <summary>A button's label lays out in the button's box.</summary>
    public FrameworkElement? Owner;

    // Texts are black, white in dark mode. ponytail: read once at launch; follow SystemEvents if it must switch live.
    static readonly Brush Ink = Microsoft.Win32.Registry.GetValue(@"HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize", "AppsUseLightTheme", 1) is 0 ? Brushes.White : Brushes.Black;

    public View()
    {
        // Hit-testable everywhere, as a web box is.
        Background = Brushes.Transparent;
        SizeChanged += (_, e) => Resized?.Invoke(e.NewSize);
    }

    static Rect FrameOf(FrameworkElement child) => (child.Tag as Place)?.Frame ?? default;

    protected override Size MeasureOverride(Size available)
    {
        foreach (FrameworkElement child in InternalChildren) child.Measure(FrameOf(child).Size);
        return new Size(0, Content?.Height ?? 0);
    }

    protected override Size ArrangeOverride(Size final)
    {
        foreach (FrameworkElement child in InternalChildren) child.Arrange(FrameOf(child));
        Clip = Clips ? Rounded(new Rect(final)) : null;
        return final;
    }

    /// <summary>The box with its corners rounded, the radius capped at half the shorter side (as CSS scales it).</summary>
    RectangleGeometry Rounded(Rect box)
    {
        var r = Math.Min(Radius, Math.Min(box.Width, box.Height) / 2);
        return new RectangleGeometry(box, r, r);
    }

    protected override void OnRender(DrawingContext dc)
    {
        var box = new Rect(RenderSize);
        var rounded = Rounded(box);
        dc.DrawGeometry(Background, null, rounded); // the background (Panel's own is square)
        if (Image is { Width: > 0, Height: > 0 } image)
        {
            // Cover: scaled to fill, centred, cropped to the rounded box.
            var scale = Math.Max(box.Width / image.Width, box.Height / image.Height);
            var size = new Size(image.Width * scale, image.Height * scale);
            dc.PushClip(rounded);
            dc.DrawImage(image, new Rect(new Point((box.Width - size.Width) / 2, (box.Height - size.Height) / 2), size));
            dc.Pop();
        }
        if (Stroke != default)
            dc.DrawGeometry(StrokeBrush ?? Brushes.Black, null, new GeometryGroup { FillRule = FillRule.EvenOdd, Children = { rounded, Inner(box, rounded.RadiusX, Stroke) } });
        if (string.IsNullOrEmpty(Text) || (Owner ?? this).Tag is not Place place) return;
        // In its box from where JS put it (the frame is snapped, the text is not), each baseline on a device pixel.
        var origin = Owner is null ? default : TranslatePoint(default, Owner);
        var x0 = Pad.Left + place.Offset.X - origin.X;
        var y0 = Pad.Top + place.Offset.Y - origin.Y;
        var width = place.Layout.Width - Pad.Left - Pad.Right;
        var pixels = VisualTreeHelper.GetDpi(this).DpiScaleX;
        var line = Typeset.LineHeight(Font.Size, pixels);
        var first = Typeset.Baseline(Font, pixels);
        var lines = Typeset.Lines(Text, Font, width + 0.01, Color ?? Ink, pixels);
        for (var i = 0; i < lines.Count; i++)
        {
            var slack = width - lines[i].Width;
            var x = x0 + (Align == "center" ? slack / 2 : Align == "right" ? slack : 0);
            var y = Typeset.Round((y0 + i * line + first) * pixels) / pixels - lines[i].Baseline;
            lines[i].Draw(dc, new Point(x, y), InvertAxes.None);
            lines[i].Dispose();
        }
    }

    /// <summary>The border's inner edge (CSS padding box): each corner's radii shrink by the widths beside it.</summary>
    static Geometry Inner(Rect box, double r, Thickness w)
    {
        double x0 = box.Left + w.Left, y0 = box.Top + w.Top, x1 = box.Right - w.Right, y1 = box.Bottom - w.Bottom;
        if (x1 <= x0 || y1 <= y0) return Geometry.Empty;
        Size Corner(double side, double top) => new(Math.Min(Math.Max(0, r - side), (x1 - x0) / 2), Math.Min(Math.Max(0, r - top), (y1 - y0) / 2));
        Size tl = Corner(w.Left, w.Top), tr = Corner(w.Right, w.Top), br = Corner(w.Right, w.Bottom), bl = Corner(w.Left, w.Bottom);
        var inner = new StreamGeometry();
        using (var c = inner.Open())
        {
            c.BeginFigure(new Point(x0 + tl.Width, y0), true, true);
            c.LineTo(new Point(x1 - tr.Width, y0), false, false);
            c.ArcTo(new Point(x1, y0 + tr.Height), tr, 0, false, SweepDirection.Clockwise, false, false);
            c.LineTo(new Point(x1, y1 - br.Height), false, false);
            c.ArcTo(new Point(x1 - br.Width, y1), br, 0, false, SweepDirection.Clockwise, false, false);
            c.LineTo(new Point(x0 + bl.Width, y1), false, false);
            c.ArcTo(new Point(x0, y1 - bl.Height), bl, 0, false, SweepDirection.Clockwise, false, false);
            c.LineTo(new Point(x0, y0 + tl.Height), false, false);
            c.ArcTo(new Point(x0 + tl.Width, y0), tl, 0, false, SweepDirection.Clockwise, false, false);
        }
        return inner;
    }
}

/// <summary>A text's font: Inter (fonts/ next to app.js), or the OS font for fontFamily "system".</summary>
record Font(double Size = 14, bool Bold = false, bool Os = false)
{
    public static readonly FontFamily Inter = new(new Uri(AppContext.BaseDirectory + "fonts/"), "./#Inter");
    FontFamily Family => Os ? SystemFonts.MessageFontFamily : Inter;
    public Typeface Typeface => new(Family, FontStyles.Normal, Bold ? FontWeights.Bold : FontWeights.Normal, FontStretches.Normal);
    /// <summary>Ascent and descent in em: Inter's hhea values, or the OS font's.</summary>
    public (double Ascent, double Descent) Em => Os ? (Family.Baseline, Family.LineSpacing - Family.Baseline) : (0.96875, 0.2412109375);
}

/// <summary>Text the contract's way (layout.ts): line height 1.35 × size, lines broken by WPF's TextFormatter.</summary>
static class Typeset
{
    static readonly TextFormatter Formatter = TextFormatter.Create(TextFormattingMode.Ideal);

    /// <summary>JavaScript's Math.round (Math.Round rounds halves to even).</summary>
    public static double Round(double v) => Math.Floor(v + 0.5);

    /// <summary>A line's height on the browser's 1/64 device-pixel grid, `pixels` device pixels per DIP.</summary>
    public static double LineHeight(double size, double pixels) => Math.Floor(size * 1.35 * pixels * 64 + 1e-6) / (pixels * 64);

    /// <summary>Where the browser puts the baseline in a line: ascent and descent rounded to device pixels, half the leading above, floored.</summary>
    public static double Baseline(Font font, double pixels)
    {
        var ascent = Round(font.Em.Ascent * font.Size * pixels);
        var descent = Round(font.Em.Descent * font.Size * pixels);
        return (ascent + Math.Floor((LineHeight(font.Size, pixels) * pixels - ascent - descent) / 2)) / pixels;
    }

    /// <summary>The lines as drawn, wrapped at maxWidth (&lt; 0: only at newlines); the caller disposes them.</summary>
    public static List<TextLine> Lines(string text, Font font, double maxWidth, Brush brush, double pixels)
    {
        var run = new Run(font, brush) { PixelsPerDip = pixels };
        var paragraph = new Paragraph(run, maxWidth < 0 ? TextWrapping.NoWrap : TextWrapping.WrapWithOverflow);
        var lines = new List<TextLine>();
        if (text.Length == 0) return lines;
        foreach (var part in text.Split('\n'))
        {
            var source = new Source(part, run);
            var at = 0;
            do
            {
                // The paragraph's last line also holds its end mark, so `at` passes the length.
                var line = Formatter.FormatLine(source, at, maxWidth < 0 ? 1e6 : Math.Max(maxWidth, 0.01), paragraph, null);
                lines.Add(line);
                at += line.Length;
            } while (at < part.Length);
        }
        return lines;
    }

    /// <summary>__nuclo_measure for a text: the widest line without trailing spaces, rounded up to 1/100, and lines × line height.</summary>
    public static string Measure(string text, Font font, double maxWidth, double pixels)
    {
        var lines = Lines(text, font, maxWidth, Brushes.Black, pixels);
        var width = Math.Ceiling(lines.Select(l => l.Width).DefaultIfEmpty(0).Max() * 100 - 0.001) / 100;
        var height = lines.Count * LineHeight(font.Size, pixels);
        lines.ForEach(l => l.Dispose());
        return Invariant($"{width} {height}");
    }

    sealed class Source(string text, TextRunProperties run) : TextSource
    {
        public override TextRun GetTextRun(int at) =>
            at < text.Length ? new TextCharacters(text, at, text.Length - at, run) : new TextEndOfParagraph(1);

        public override TextSpan<CultureSpecificCharacterBufferRange> GetPrecedingText(int limit)
        {
            var before = Math.Min(limit, text.Length);
            return new(before, new CultureSpecificCharacterBufferRange(CultureInfo.InvariantCulture, new CharacterBufferRange(text, 0, before)));
        }

        public override int GetTextEffectCharacterIndexFromTextSourceCharacterIndex(int at) => at;
    }

    sealed class Run(Font font, Brush brush) : TextRunProperties
    {
        public override Typeface Typeface { get; } = font.Typeface;
        public override double FontRenderingEmSize => font.Size;
        public override double FontHintingEmSize => font.Size;
        public override TextDecorationCollection TextDecorations => null!;
        public override Brush ForegroundBrush => brush;
        public override Brush BackgroundBrush => null!;
        public override CultureInfo CultureInfo => CultureInfo.InvariantCulture;
        public override TextEffectCollection TextEffects => null!;
    }

    sealed class Paragraph(TextRunProperties run, TextWrapping wrap) : TextParagraphProperties
    {
        public override FlowDirection FlowDirection => FlowDirection.LeftToRight;
        public override TextAlignment TextAlignment => TextAlignment.Left;
        public override double LineHeight => 0;
        public override bool FirstLineInParagraph => true;
        public override TextRunProperties DefaultTextRunProperties => run;
        public override TextWrapping TextWrapping => wrap;
        public override TextMarkerProperties? TextMarkerProperties => null;
        public override double Indent => 0;
    }
}

/// <summary>One page of a stack: a layout root, laid out at its width; its content scrolls.</summary>
/// <summary>A video: MediaElement, fitted on black, with a play/pause button (WPF has no player controls).</summary>
class Video : Grid
{
    readonly MediaElement player = new()
    {
        LoadedBehavior = MediaState.Manual,
        UnloadedBehavior = MediaState.Close,
        Stretch = Stretch.Uniform,
        ScrubbingEnabled = true,
    };
    readonly Button toggle = new()
    {
        FontFamily = new FontFamily("Segoe Fluent Icons, Segoe MDL2 Assets"),
        Width = 40,
        Height = 40,
        Margin = new Thickness(8),
        HorizontalAlignment = HorizontalAlignment.Left,
        VerticalAlignment = VerticalAlignment.Bottom,
    };
    bool playing;

    public Video()
    {
        Background = Brushes.Black;
        ClipToBounds = true;
        Children.Add(player);
        Children.Add(toggle);
        toggle.Click += (_, _) => Play(!playing);
        player.MediaEnded += (_, _) =>
        {
            player.Stop();
            Play(false);
        };
        Play(false);
    }

    public Uri Source
    {
        set
        {
            player.Source = value;
            // Opens the file and shows its first frame.
            player.Play();
            player.Pause();
        }
    }

    void Play(bool on)
    {
        playing = on;
        if (on) player.Play();
        else if (player.Source is not null) player.Pause();
        toggle.Content = on ? "\uE769" : "\uE768"; // Pause, Play
    }
}

class Screen : ScrollViewer
{
    public readonly View Body = new() { UseLayoutRounding = false };
    public readonly TranslateTransform Shift = new();
    public Stack? Owner;
    public string Title = "";
    double width;

    public Screen(FrameworkElement body)
    {
        Content = Body;
        // A screen scrolls like a feed: no scrollbar beside the content.
        VerticalScrollBarVisibility = ScrollBarVisibility.Hidden;
        RenderTransform = Shift;
        // The page colour is the body's backgroundColor.
        SetBinding(BackgroundProperty, new Binding(nameof(Panel.Background)) { Source = body });
        Body.Resized = size =>
        {
            if (size.Width == width) return;
            width = size.Width;
            Program.Emit(int.Parse(Uid), "resize", Invariant($"{size.Width} {ActualHeight} {Program.Scale}"));
        };
        // JS loads more as the end comes near (dom.ts, "end").
        ScrollChanged += (_, e) =>
        {
            if (e.VerticalChange != 0 || e.ViewportHeightChange != 0)
                Program.Emit(int.Parse(Uid), "scroll", Invariant($"{e.VerticalOffset} {e.ViewportHeight}"));
        };
    }
}

/// <summary>A navigation stack: back button and page title over the top screen.</summary>
class Stack : DockPanel
{
    static readonly FontFamily Icons = new("Segoe Fluent Icons, Segoe MDL2 Assets");
    static readonly Dictionary<string, string> Glyphs = new() { ["chart"] = "\uE9D2", ["photo"] = "\uE91B", ["person"] = "\uE77B", ["home"] = "\uE80F", ["search"] = "\uE721", ["bell"] = "\uEA8F" };

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
        // A click on the header, or on this stack's item while it is selected, goes back to the screen's top.
        var header = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(16, 12, 16, 4), Background = Brushes.Transparent, Children = { back, title } };
        header.MouseLeftButtonUp += (_, _) => current?.ScrollToTop();
        Item.PreviewMouseLeftButtonDown += (_, _) => { if (Item.IsSelected) current?.ScrollToTop(); };
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

static partial class Program
{
    static readonly Dictionary<int, FrameworkElement> Views = new();
    static readonly Engine Js = new();
    static Window Win = null!;
    /// <summary>The body: without the router, the layout root at the window's content size.</summary>
    static readonly View Root = new() { UseLayoutRounding = false };
    /// <summary>True while a JS batch is applied: selection changes then are programmatic, not the user's.</summary>
    internal static bool Batching;
    /// <summary>A frame op arrived: the batch's end snaps the frames to device pixels.</summary>
    static bool Placed;
    /// <summary>Device data JS watches (src/device.ts): name → its last JSON, "" when the device has none.</summary>
    static readonly Dictionary<string, string> Devices = new();

    /// <summary>Device pixels per DIP.</summary>
    internal static double Scale => VisualTreeHelper.GetDpi(Win).DpiScaleX;

    [STAThread]
    static void Main()
    {
#pragma warning disable WPF0001 // ThemeMode is experimental
        var app = new Application { ThemeMode = ThemeMode.System };
#pragma warning restore WPF0001
        Views[1] = Root;
        // The chrome lands on whole pixels; layout roots opt out and snap their own boxes (SnapFrames).
        Win = new Window { Title = "nuclo-native", Width = 420, Height = 640, Content = Root, UseLayoutRounding = true };
        var size = Size.Empty;
        Root.Resized = next =>
        {
            if (next == size) return;
            size = next;
            Emit(1, "resize", Invariant($"{next.Width} {next.Height} {Scale}"));
        };
        // Back: Alt+Left and the mouse back button, like any Windows app.
        Win.PreviewKeyDown += (_, e) => { if (e.SystemKey == Key.Left && Keyboard.Modifiers == ModifierKeys.Alt) e.Handled = Back(); };
        Win.PreviewMouseDown += (_, e) => { if (e.ChangedButton == MouseButton.XButton1) e.Handled = Back(); };

        Js.SetValue("__nuclo_host", new Action<string>(json =>
        {
            using var ops = JsonDocument.Parse(json);
            Batching = true;
            foreach (var op in ops.RootElement.EnumerateArray()) Apply(op);
            if (Placed) SnapFrames();
            foreach (var view in Views.Values)
            {
                if (view is Stack stack) stack.Sync();
                else if (view is Tabs tabs) tabs.Sync();
            }
            Batching = false;
        }));
        Js.SetValue("__nuclo_measure", new Func<double, double, string>(Measure));
        Js.SetValue("__nuclo_device", new Func<string, string>(name =>
        {
            if (name == "frames") return FramesJson();
            if (!Devices.TryGetValue(name, out var json))
            {
                Devices[name] = json = name == "battery" ? Battery() : "";
                // Windows has no battery event without a window handle: poll.
                if (name == "battery") new DispatcherTimer(TimeSpan.FromSeconds(10), DispatcherPriority.Background, (_, _) => Changed(name, Battery()), Dispatcher.CurrentDispatcher).Start();
            }
            return json;
        }));
        // setTimeout for JS: fires once, as its own event.
        Js.SetValue("__nuclo_timer", new Action<double, double>((id, ms) =>
            new DispatcherTimer(TimeSpan.FromMilliseconds(Math.Max(0, ms)), DispatcherPriority.Normal, (timer, _) =>
            {
                ((DispatcherTimer)timer!).Stop();
                Emit((int)id, "timer");
            }, Dispatcher.CurrentDispatcher).Start()));
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

    static void Changed(string name, string json)
    {
        if (Devices[name] == json) return;
        Devices[name] = json;
        Js.Invoke("__nuclo_device_changed", name, json);
    }

    struct PowerStatus
    {
        public byte ACLineStatus, BatteryFlag, BatteryLifePercent, SystemStatusFlag;
        public int BatteryLifeTime, BatteryFullLifeTime;
    }

    [LibraryImport("kernel32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static partial bool GetSystemPowerStatus(out PowerStatus status);

    /// <summary>The battery as src/device.ts's JSON, or "" when there is none.</summary>
    static string Battery()
    {
        if (!GetSystemPowerStatus(out var s) || s.BatteryFlag == 128) return ""; // 128: no system battery
        var state = s.BatteryFlag != 255 && (s.BatteryFlag & 8) != 0 ? "charging" // 255: flags unknown
            : s.ACLineStatus == 0 ? "discharging"
            : s.ACLineStatus == 1 && s.BatteryLifePercent == 100 ? "full"
            : "unknown";
        return JsonSerializer.Serialize(new
        {
            level = s.BatteryLifePercent == 255 ? null : (double?)s.BatteryLifePercent / 100,
            state,
            // Seconds to empty, -1 unknown; Windows does not say how long until full.
            minutes = state == "discharging" && s.BatteryLifeTime >= 0 ? (int?)Math.Round(s.BatteryLifeTime / 60.0) : null,
        });
    }

    static double Px(string value) => double.Parse(value.Replace("px", ""), CultureInfo.InvariantCulture);
    /// <summary>"#rrggbb" or "#rrggbbaa" (CSS order; WPF reads #aarrggbb).</summary>
    static Brush Color(string value) => (Brush)new BrushConverter().ConvertFromString(value.Length == 9 ? "#" + value[7..] + value[1..7] : value)!;
    /// <summary>"t r b l" as a Thickness; "" is none.</summary>
    static Thickness Sides(string value)
    {
        if (value == "") return default;
        var v = value.Split(' ').Select(Px).ToArray();
        return new Thickness(v[3], v[0], v[1], v[2]);
    }

    /// <summary>An input's text sits its inset in: WPF's text view adds 2 inside the template's border.</summary>
    static void Inset(TextBox input)
    {
        var (inset, border) = (Place.Of(input).Inset, input.BorderThickness);
        input.Padding = new Thickness(Math.Max(0, inset.Left - border.Left - 2), 0, Math.Max(0, inset.Right - border.Right - 2), 0);
    }

    /// <summary>A button's label (it holds the button's text, font and colour), or the view itself.</summary>
    static View? TextOf(FrameworkElement view) => (view as Button)?.Content as View ?? view as View;

    /// <summary>__nuclo_measure: a leaf's content size (layout.ts adds the padding). Images: their natural pixel size.</summary>
    static string Measure(double id, double maxWidth)
    {
        var view = Views.GetValueOrDefault((int)id);
        if (view is View { Image: BitmapSource bitmap }) return Invariant($"{bitmap.PixelWidth} {bitmap.PixelHeight}");
        if (view is null || TextOf(view) is not { Text: { } text } label) return "0 0";
        return Typeset.Measure(text, label.Font, maxWidth, Scale);
    }

    /// <summary>Places views at their frames with edges on device pixels, as the browser paints boxes: each edge
    /// rounds from its unsnapped position on screen, so boxes never blur or gap. Texts keep the unsnapped offset.</summary>
    static void SnapFrames()
    {
        Placed = false;
        var pixels = Scale;
        double Snap(double v) => Typeset.Round(v * pixels) / pixels;
        void Walk(Panel parent, Point at, Point snapped)
        {
            foreach (FrameworkElement child in parent.Children)
            {
                if (child.Tag is not Place place) continue;
                var x = at.X + place.Layout.X;
                var y = at.Y + place.Layout.Y;
                var edge = new Point(Snap(x), Snap(y));
                var frame = new Rect(edge.X - snapped.X, edge.Y - snapped.Y,
                    Math.Max(0, Snap(x + place.Layout.Width) - edge.X), Math.Max(0, Snap(y + place.Layout.Height) - edge.Y));
                var offset = new Vector(x - edge.X, y - edge.Y);
                if (frame != place.Frame)
                {
                    place.Frame = frame;
                    parent.InvalidateMeasure();
                    parent.InvalidateArrange();
                }
                if (offset != place.Offset)
                {
                    place.Offset = offset;
                    TextOf(child)?.InvalidateVisual();
                }
                if (child is View view) Walk(view, new Point(x, y), edge);
            }
        }
        Walk(Root, default, default);
        foreach (var screen in Views.Values.OfType<Screen>()) Walk(screen.Body, default, default);
    }

    /// <summary>__nuclo_device("frames"): every view's frame as placed, relative to its parent; layout roots are their own origin (check.ts).</summary>
    static string FramesJson()
    {
        var frames = new Dictionary<string, double[]>();
        foreach (var (id, view) in Views)
        {
            Rect? frame = view switch
            {
                Stack or Tabs => null,
                _ when id == 1 => new Rect(view.RenderSize),
                Screen screen => screen.Body.Content is { } content ? new Rect(content) : null,
                _ => (view.Tag as Place)?.Frame,
            };
            if (frame is { } f) frames[id.ToString()] = [.. new[] { f.X, f.Y, f.Width, f.Height }.Select(v => Math.Round(v * 100) / 100)];
        }
        return JsonSerializer.Serialize(frames);
    }

    /// <summary>The toolkit's button filling its frame; its label is a text view, so what is measured is what is drawn.</summary>
    static Button NewButton()
    {
        var label = new View { Text = "", Align = "center" };
        var button = new Button
        {
            Content = label,
            Padding = new Thickness(0),
            MinWidth = 0,
            MinHeight = 0,
            HorizontalContentAlignment = HorizontalAlignment.Stretch,
            VerticalContentAlignment = VerticalAlignment.Stretch,
        };
        label.Owner = button;
        return button;
    }

    static void Apply(JsonElement op)
    {
        var id = op[1].GetInt32();
        switch (op[0].GetString())
        {
            case "create":
                Views[id] = op[2].GetString() switch
                {
                    "text" => new View { Text = "" },
                    "button" => NewButton(),
                    // Fills its frame, text centred and 8 in (WPF's text view adds 2 inside the 1-DIP border).
                    "input" => new TextBox
                    {
                        MinWidth = 0,
                        MinHeight = 0,
                        Padding = new Thickness(5, 0, 5, 0),
                        VerticalContentAlignment = VerticalAlignment.Center,
                        FontFamily = Font.Inter,
                        FontSize = 14,
                    },
                    // The toolkit's checkbox, centred in its 24 × 24 box.
                    "checkbox" => new CheckBox
                    {
                        MinWidth = 0,
                        MinHeight = 0,
                        Padding = new Thickness(0),
                        HorizontalAlignment = HorizontalAlignment.Center,
                        VerticalAlignment = VerticalAlignment.Center,
                    },
                    "screen" => new Screen(Views[1]),
                    "stack" => new Stack(),
                    "tabs" => new Tabs(),
                    "video" => new Video(),
                    _ => new View(), // view, image
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

            case "frame":
                // DIPs, relative to the parent. A screen's is its scrolling content; the body's is the window's.
                var size = new Size(Math.Max(0, op[4].GetDouble()), Math.Max(0, op[5].GetDouble()));
                if (Views[id] is Screen root)
                {
                    root.Body.Content = size;
                    root.Body.InvalidateMeasure();
                }
                else if (id != 1)
                {
                    Place.Of(Views[id]).Layout = new Rect(new Point(op[2].GetDouble(), op[3].GetDouble()), size);
                    Placed = true;
                }
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
        if (Win.Content == view) Win.Content = Root;
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
        else if (key == "text" && TextOf(view) is { Text: not null } label)
        {
            label.Text = text;
            label.InvalidateVisual();
        }
        else if (key == "value" && view is TextBox box && box.Text != text) box.Text = text;
        else if (key == "checked" && view is CheckBox check) check.IsChecked = value.ValueKind == JsonValueKind.True;
        else if (key == "src" && view is Video video) video.Source = new Uri(Path.Combine(AppContext.BaseDirectory, text));
        else if (key == "src" && view is View image)
        {
            // Asset paths are relative to the bundle.
            image.Image = new BitmapImage(new Uri(Path.Combine(AppContext.BaseDirectory, text)));
            image.InvalidateArrange();
            image.InvalidateVisual();
        }
        else if (key == "disabled") view.IsEnabled = value.ValueKind != JsonValueKind.True;
    }

    /// <summary>Paint and text styles, already resolved by JS (src/style.ts); "" resets a key to its default, unknown keys are
    /// ignored. Layout is JS's: it arrives as frames, and padding and borders never move children.</summary>
    static void Style(FrameworkElement view, string key, string value)
    {
        var label = TextOf(view)?.Text is null ? null : TextOf(view); // texts and button labels
        var control = view as Control;
        var reset = value == "";
        switch (key)
        {
            case "opacity": view.Opacity = reset ? 1 : Px(value); break;
            // Hidden, not collapsed: JS laid it out without the box.
            case "display": view.Visibility = value == "none" ? Visibility.Hidden : Visibility.Visible; break;
            case "backgroundColor" when view is View box: box.Background = reset ? Brushes.Transparent : Color(value); break;
            case "backgroundColor" when control is not null:
                if (reset) control.ClearValue(Control.BackgroundProperty);
                else control.Background = Color(value);
                break;
            case "borderRadius" when view is View box:
                box.Radius = reset ? 0 : Px(value);
                box.InvalidateArrange();
                break;
            // The Fluent templates round their border with the attached Border.CornerRadius.
            case "borderRadius":
                if (reset) view.ClearValue(Border.CornerRadiusProperty);
                else view.SetValue(Border.CornerRadiusProperty, new CornerRadius(Px(value)));
                break;
            case "overflow" when view is View box:
                box.Clips = value == "hidden";
                box.InvalidateArrange();
                break;
            case "borderWidth" when view is View box: box.Stroke = Sides(value); break;
            // A control's template border insets its content: a button's label draws from the button's box anyway, an input re-insets.
            case "borderWidth" when control is not null:
                if (reset) control.ClearValue(Control.BorderThicknessProperty);
                else control.BorderThickness = Sides(value);
                if (control is TextBox field) Inset(field);
                break;
            case "borderColor" when view is View box: box.StrokeBrush = reset ? null : Color(value); break;
            case "borderColor" when control is not null:
                if (reset) control.ClearValue(Control.BorderBrushProperty);
                else control.BorderBrush = Color(value);
                break;
            // Texts and button labels draw their text inset; an input keeps its text the inset's left and right in.
            case "padding" when label is not null: label.Pad = Sides(value); break;
            case "padding" when view is TextBox input:
                Place.Of(input).Inset = Sides(value);
                Inset(input);
                break;
            case "textAlign" when label is not null: label.Align = reset ? "left" : value; break;
            case "color" when label is not null: label.Color = reset ? null : Color(value); break;
            case "color" when control is not null:
                if (reset) control.ClearValue(Control.ForegroundProperty);
                else control.Foreground = Color(value);
                break;
            case "fontSize" or "fontWeight" or "fontFamily":
                var font = label?.Font ?? new Font(control?.FontSize ?? 14, control?.FontWeight == FontWeights.Bold, control?.FontFamily != Font.Inter);
                font = key switch
                {
                    "fontSize" => font with { Size = reset ? 14 : Px(value) },
                    "fontWeight" => font with { Bold = value == "bold" || (int.TryParse(value, out var weight) && weight >= 600) },
                    _ => font with { Os = value == "system" },
                };
                if (label is not null) label.Font = font;
                else if (control is not null)
                {
                    control.FontSize = font.Size;
                    control.FontWeight = font.Bold ? FontWeights.Bold : FontWeights.Normal;
                    control.FontFamily = font.Os ? SystemFonts.MessageFontFamily : Font.Inter;
                }
                break;
        }
        (label ?? view as View)?.InvalidateVisual();
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
