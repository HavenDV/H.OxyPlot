using H.OxyPlot.Apps.ViewModels;
#if !WINDOWS_UWP && !HAS_UNO
using Microsoft.Win32;
#endif

#nullable enable

namespace H.OxyPlot.Apps.Views;

public sealed partial class MainView
{
    public MainViewModel ViewModel { get; } = new();

    public MainView()
    {
        InitializeComponent();
#if !WINDOWS_UWP && !HAS_UNO
        SystemEvents.DisplaySettingsChanged += SystemEvents_DisplaySettingsChanged;
#endif
    }

    private void SystemEvents_DisplaySettingsChanged(object? sender, EventArgs e)
    {
        ViewModel.PlotModel?.PlotView?.InvalidatePlot(false);
    }
}
