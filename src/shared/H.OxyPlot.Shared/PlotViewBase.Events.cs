// --------------------------------------------------------------------------------------------------------------------
// <copyright file="PlotViewBase.Events.cs" company="OxyPlot">
//   Copyright (c) 2020 OxyPlot contributors
// </copyright>
// --------------------------------------------------------------------------------------------------------------------

using OxyPlot.Utilities;

namespace OxyPlot
{

    /// <summary>
    /// Base class for WPF PlotView implementations.
    /// </summary>
    public abstract partial class PlotViewBase
    {
#if !HAS_WPF
        /// <summary>
        /// The state of the Alt key.
        /// </summary>
        private bool isAltPressed;

        /// <summary>
        /// The state of the Windows key.
        /// </summary>
        private bool isWindowsPressed;

        /// <summary>
        /// The state of the Control key.
        /// </summary>
        private bool isControlPressed;

        /// <summary>
        /// The is shift pressed.
        /// </summary>
        private bool isShiftPressed;
#endif

        /// <summary>
        /// Called before the KeyDown event occurs.
        /// </summary>
        /// <param name="e">The data for the event.</param>
#if HAS_WPF
        protected override void OnKeyDown(KeyEventArgs e)
#else
        protected override void OnKeyDown(KeyRoutedEventArgs e)
#endif
        {
            e = e ?? throw new ArgumentNullException(nameof(e));

#if !HAS_WPF
            switch (e.Key)
            {
                case VirtualKey.Control:
                    isControlPressed = true;
                    break;
                case VirtualKey.Shift:
                    isShiftPressed = true;
                    break;
                case VirtualKey.Menu:
                    isAltPressed = true;
                    break;
                case VirtualKey.LeftWindows:
                case VirtualKey.RightWindows:
                    isWindowsPressed = true;
                    break;
            }

            var modifiers = OxyModifierKeys.None;
            if (isControlPressed)
            {
                modifiers |= OxyModifierKeys.Control;
            }

            if (isAltPressed)
            {
                modifiers |= OxyModifierKeys.Control;
            }

            if (isShiftPressed)
            {
                modifiers |= OxyModifierKeys.Shift;
            }

            if (isWindowsPressed)
            {
                modifiers |= OxyModifierKeys.Windows;
            }
#endif

            base.OnKeyDown(e);
            if (e.Handled)
            {
                return;
            }

            var args = new OxyKeyEventArgs
            {
                Key = e.Key.Convert(),
#if HAS_WPF
                ModifierKeys = Utilities.Keyboard.GetModifierKeys(),
#else
                ModifierKeys = modifiers,
#endif
            };
            e.Handled = ActualController.HandleKeyDown(this, args);
        }

#if !HAS_WPF
        /// <summary>
        /// Called before the KeyUp event occurs.
        /// </summary>
        /// <param name="e">The data for the event.</param>
        protected override void OnKeyUp(KeyRoutedEventArgs e)
        {
            e = e ?? throw new ArgumentNullException(nameof(e));

            base.OnKeyUp(e);
            switch (e.Key)
            {
                case VirtualKey.Control:
                    this.isControlPressed = false;
                    break;
                case VirtualKey.Shift:
                    this.isShiftPressed = false;
                    break;
                case VirtualKey.Menu:
                    this.isAltPressed = false;
                    break;
                case VirtualKey.LeftWindows:
                case VirtualKey.RightWindows:
                    this.isWindowsPressed = false;
                    break;
            }
        }
#endif

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

        /// <summary>
        /// Called before the Wheel event occurs to provide handling for the event in a derived class without attaching a delegate.
        /// </summary>
        /// <param name="e">A <see cref="MouseWheelEventArgs" /> that contains the event data.</param>
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
}
