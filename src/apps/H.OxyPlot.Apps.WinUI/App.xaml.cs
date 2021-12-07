namespace H.OxyPlot.Apps;

public sealed partial class App : Application
{
    public App()
    {
        InitializeComponent();
    }

    protected override void OnLaunched(LaunchActivatedEventArgs args)
    {
        var frame = new Frame();
        frame.Navigate(typeof(MainPage), args.Arguments);

        var window = new Window
        {
            Content = frame
        };
        window.Activate();
    }
}
