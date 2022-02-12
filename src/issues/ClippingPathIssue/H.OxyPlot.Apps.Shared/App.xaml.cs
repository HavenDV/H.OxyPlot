using H.OxyPlot.Apps.Views;
#if !HAS_WPF
using Windows.ApplicationModel.Activation;
#endif

#nullable enable

namespace H.OxyPlot.Apps;

public sealed partial class App
{
    #region Constructors

    public App()
    {
#if !HAS_WPF
        InitializeComponent();
#endif
    }

    #endregion

    #region Event Handlers

#if !HAS_WPF

    protected override void OnLaunched(LaunchActivatedEventArgs args)
    {
#if HAS_WINUI
        var window = new Window();
#else
        var window = Window.Current;
#endif
        if (window.Content is not Frame frame)
        {
            frame = new Frame();

            window.Content = frame;
        }

#if !HAS_WINUI
        if (args.PrelaunchActivated)
        {
            return;
        }
#endif

        if (frame.Content is null)
        {
            frame.Content = new MainView();
        }

        window.Activate();
    }

#endif

    #endregion
}
