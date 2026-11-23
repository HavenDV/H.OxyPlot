namespace H.OxyPlot.Apps;

public partial class MainWindow : System.Windows.Window
{
    public MainWindow()
    {
        InitializeComponent();

        Root.Content = new global::Uno.UI.Runtime.Skia.Wpf.WpfHost(Dispatcher, () => new global::H.OxyPlot.Apps.App());
    }
}
