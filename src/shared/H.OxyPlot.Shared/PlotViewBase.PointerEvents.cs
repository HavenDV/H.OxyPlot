// --------------------------------------------------------------------------------------------------------------------
// <copyright file="PlotViewBase.PointerEvents.cs" company="OxyPlot">
//   Copyright (c) 2020 OxyPlot contributors
// </copyright>
// --------------------------------------------------------------------------------------------------------------------

using OxyPlot.Utilities;

namespace OxyPlot;

public abstract partial class PlotViewBase
{
    /// <summary>
    /// Called before the Wheel event occurs to provide handling for the event in a derived class without attaching a delegate.
    /// </summary>
    /// <param name="e">A Wheel EventArgs that contains the event data.</param>
#if HAS_WPF
    protected override void OnMouseWheel(MouseWheelEventArgs e)
#else
    protected override void OnPointerWheelChanged(PointerRoutedEventArgs e)
#endif
    {
        e = e ?? throw new ArgumentNullException(nameof(e));

#if HAS_WPF
        base.OnMouseWheel(e);
#else
        base.OnPointerWheelChanged(e);
#endif
        if (e.Handled || !this.IsMouseWheelEnabled)
        {
            return;
        }

        e.Handled = this.ActualController.HandleMouseWheel(this, e.ToMouseWheelEventArgs(this));
    }

    /// <summary>
    /// Called before the PointerPressed event occurs.
    /// </summary>
    /// <param name="e">Event data for the event.</param>
#if HAS_WPF
    protected override void OnMouseDown(MouseButtonEventArgs e)
#else
    protected override void OnPointerPressed(PointerRoutedEventArgs e)
#endif
    {
        e = e ?? throw new ArgumentNullException(nameof(e));

#if HAS_WPF
        base.OnMouseDown(e);
#else
        base.OnPointerPressed(e);
#endif

        if (e.Handled)
        {
            return;
        }

#if HAS_WPF
        this.Focus();
        this.CaptureMouse();

        // store the mouse down point, check it when mouse button is released to determine if the context menu should be shown
        this.mouseDownPoint = e.GetPosition(this).ToScreenPoint();

        e.Handled = this.ActualController.HandleMouseDown(this, e.ToMouseDownEventArgs(this));
#else
        if (e.Pointer.PointerDeviceType == PointerDeviceType.Mouse)
        {
            this.Focus(FocusState.Pointer);
            this.CapturePointer(e.Pointer);

            e.Handled = this.ActualController.HandleMouseDown(this, e.ToMouseDownEventArgs(this));
        }
        else if (e.Pointer.PointerDeviceType == PointerDeviceType.Touch)
        {
            this.Focus(FocusState.Pointer);

            e.Handled = this.ActualController.HandleTouchStarted(this, e.ToTouchEventArgs(this));
        }
#endif
    }

    /// <summary>
    /// Called before the PointerMoved event occurs.
    /// </summary>
    /// <param name="e">Event data for the event.</param>
#if HAS_WPF
    protected override void OnMouseMove(MouseEventArgs e)
#else
    protected override void OnPointerMoved(PointerRoutedEventArgs e)
#endif
    {
        e = e ?? throw new ArgumentNullException(nameof(e));

#if HAS_WPF
        base.OnMouseMove(e);
#else
        base.OnPointerMoved(e);
#endif

        if (e.Handled)
        {
            return;
        }

#if !HAS_WPF
        if (e.Pointer.PointerDeviceType != PointerDeviceType.Mouse)
        {
            return;
        }
#endif

        e.Handled = this.ActualController.HandleMouseMove(this, e.ToMouseEventArgs(this));

        // Note: don't handle touch here, this is also handled when moving over when a touch device
    }

    /// <summary>
    /// Called before the PointerReleased event occurs.
    /// </summary>
    /// <param name="e">Event data for the event.</param>
#if HAS_WPF
    protected override void OnMouseUp(MouseButtonEventArgs e)
#else
    protected override void OnPointerReleased(PointerRoutedEventArgs e)
#endif
    {
        e = e ?? throw new ArgumentNullException(nameof(e));

#if HAS_WPF
        base.OnMouseUp(e);
#else
        base.OnPointerReleased(e);
#endif

        if (e.Handled)
        {
            return;
        }

#if HAS_WPF
        this.ReleaseMouseCapture();

        e.Handled = this.ActualController.HandleMouseUp(this, e.ToMouseReleasedEventArgs(this));

        // Open the context menu
        var p = e.GetPosition(this).ToScreenPoint();
        var d = p.DistanceTo(this.mouseDownPoint);

        if (this.ContextMenu != null)
        {
            if (Math.Abs(d) < 1e-8 && e.ChangedButton == MouseButton.Right)
            {
                // TODO: why is the data context not passed to the context menu??
                this.ContextMenu.DataContext = this.DataContext;
                this.ContextMenu.PlacementTarget = this;
                this.ContextMenu.Visibility = System.Windows.Visibility.Visible;
                this.ContextMenu.IsOpen = true;
            }
            else
            {
                this.ContextMenu.Visibility = System.Windows.Visibility.Collapsed;
                this.ContextMenu.IsOpen = false;
            }
        }
#else
        if (e.Pointer.PointerDeviceType == PointerDeviceType.Mouse)
        {
            this.ReleasePointerCapture(e.Pointer);
            e.Handled = this.ActualController.HandleMouseUp(this, e.ToMouseEventArgs(this));
        }
        else if (e.Pointer.PointerDeviceType == PointerDeviceType.Touch)
        {
            e.Handled = this.ActualController.HandleTouchCompleted(this, e.ToTouchEventArgs(this));
        }
#endif
    }

    /// <summary>
    /// Called before the Entered event occurs.
    /// </summary>
    /// <param name="e">Event data for the event.</param>
#if HAS_WPF
    protected override void OnMouseEnter(MouseEventArgs e)
#else
    protected override void OnPointerEntered(PointerRoutedEventArgs e)
#endif
    {
        e = e ?? throw new ArgumentNullException(nameof(e));

#if HAS_WPF
        base.OnMouseEnter(e);
#else
        base.OnPointerEntered(e);
#endif
        if (e.Handled)
        {
            return;
        }

        e.Handled = this.ActualController.HandleMouseEnter(this, e.ToMouseEventArgs(this));
    }

    /// <summary>
    /// Called before the PointerExited event occurs.
    /// </summary>
    /// <param name="e">Event data for the event.</param>
#if HAS_WPF
    protected override void OnMouseLeave(MouseEventArgs e)
#else
    protected override void OnPointerExited(PointerRoutedEventArgs e)
#endif
    {
        e = e ?? throw new ArgumentNullException(nameof(e));

#if HAS_WPF
        base.OnMouseLeave(e);
#else
        base.OnPointerExited(e);
#endif
        if (e.Handled)
        {
            return;
        }

        e.Handled = this.ActualController.HandleMouseLeave(this, e.ToMouseEventArgs(this));
    }
}
