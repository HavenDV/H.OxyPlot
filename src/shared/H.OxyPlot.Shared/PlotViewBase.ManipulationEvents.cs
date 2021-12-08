// --------------------------------------------------------------------------------------------------------------------
// <copyright file="PlotViewBase.ManipulationEvents.cs" company="OxyPlot">
//   Copyright (c) 2020 OxyPlot contributors
// </copyright>
// --------------------------------------------------------------------------------------------------------------------

using OxyPlot.Utilities;

namespace OxyPlot;

public abstract partial class PlotViewBase
{
    /// <summary>
    /// Called when the ManipulationStarted event occurs.
    /// </summary>
    /// <param name="e">The data for the event.</param>
#if HAS_WPF
    protected override void OnManipulationStarted(ManipulationStartedEventArgs e)
#else
    protected override void OnManipulationStarted(ManipulationStartedRoutedEventArgs e)
#endif
    {
        e = e ?? throw new ArgumentNullException(nameof(e));

        base.OnManipulationStarted(e);
        if (e.Handled)
        {
            return;
        }

#if !HAS_WPF
        if (e.PointerDeviceType != PointerDeviceType.Touch)
        {
            return;
        }
        Focus(FocusState.Pointer);
#endif

        e.Handled = this.ActualController.HandleTouchStarted(this, e.ToTouchEventArgs(this));
    }

    /// <summary>
    /// Called when the ManipulationDelta event occurs.
    /// </summary>
    /// <param name="e">The data for the event.</param>
#if HAS_WPF
    protected override void OnManipulationDelta(ManipulationDeltaEventArgs e)
#else
    protected override void OnManipulationDelta(ManipulationDeltaRoutedEventArgs e)
#endif
    {
        e = e ?? throw new ArgumentNullException(nameof(e));

        base.OnManipulationDelta(e);
        if (e.Handled)
        {
            return;
        }

#if !HAS_WPF
        if (e.PointerDeviceType != PointerDeviceType.Touch)
        {
            return;
        }
#endif

        e.Handled = this.ActualController.HandleTouchDelta(this, e.ToTouchEventArgs(this));
    }

    /// <summary>
    /// Called when the ManipulationCompleted event occurs.
    /// </summary>
    /// <param name="e">The data for the event.</param>
#if HAS_WPF
    protected override void OnManipulationCompleted(ManipulationCompletedEventArgs e)
#else
    protected override void OnManipulationCompleted(ManipulationCompletedRoutedEventArgs e)
#endif
    {
        e = e ?? throw new ArgumentNullException(nameof(e));

        base.OnManipulationCompleted(e);
        if (e.Handled)
        {
            return;
        }

#if !HAS_WPF
        if (e.PointerDeviceType != PointerDeviceType.Touch)
        {
            return;
        }
#endif

        e.Handled = this.ActualController.HandleTouchCompleted(this, e.ToTouchEventArgs(this));
    }
}
