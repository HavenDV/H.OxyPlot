using Android.Views;

namespace H.OxyPlot.Apps
{
    [Activity(
			MainLauncher = true,
			ConfigurationChanges = global::Uno.UI.ActivityHelper.AllConfigChanges,
			WindowSoftInputMode = SoftInput.AdjustPan | SoftInput.StateHidden
		)]
	public class MainActivity : ApplicationActivity
	{
	}
}

