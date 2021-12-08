// --------------------------------------------------------------------------------------------------------------------
// <copyright file="PlotView.cs" company="OxyPlot">
//   Copyright (c) 2014 OxyPlot contributors
// </copyright>
// <summary>
//   Represents a control that displays a <see cref="PlotModel" />.
// </summary>
// --------------------------------------------------------------------------------------------------------------------

using OxyPlot.Utilities;

namespace OxyPlot
{
    public partial class PlotView : PlotViewBase
    {
        /// <summary>
        /// Identifies the <see cref="HandleRightClicks"/> dependency property.
        /// </summary>
        public static readonly DependencyProperty HandleRightClicksProperty =
            DependencyProperty.Register("HandleRightClicks", typeof(bool), typeof(PlotView), new PropertyMetadata(true));

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
        /// Initializes a new instance of the <see cref="PlotView" /> class.
        /// </summary>
        public PlotView()
        {
#if HAS_WPF
            this.DisconnectCanvasWhileUpdating = true;
            this.CommandBindings.Add(new CommandBinding(ApplicationCommands.Copy, this.DoCopy));
#else
            this.DefaultStyleKey = typeof(PlotView);

            this.Loaded += this.OnLoaded;
            this.SizeChanged += this.OnSizeChanged;
            this.ManipulationMode = ManipulationModes.Scale | ManipulationModes.TranslateX
                                    | ManipulationModes.TranslateY;
#endif
        }

        /// <summary>
        /// Gets or sets a value indicating whether to handle right clicks.
        /// </summary>
        public bool HandleRightClicks
        {
            get
            {
                return (bool)this.GetValue(HandleRightClicksProperty);
            }

            set
            {
                this.SetValue(HandleRightClicksProperty, value);
            }
        }

#if !HAS_WPF
        /// <summary>
        /// Called before the KeyDown event occurs.
        /// </summary>
        /// <param name="e">The data for the event.</param>
        protected override void OnKeyDown(KeyRoutedEventArgs e)
        {
            e = e ?? throw new ArgumentNullException(nameof(e));

            switch (e.Key)
            {
                case VirtualKey.Control:
                    this.isControlPressed = true;
                    break;
                case VirtualKey.Shift:
                    this.isShiftPressed = true;
                    break;
                case VirtualKey.Menu:
                    this.isAltPressed = true;
                    break;
                case VirtualKey.LeftWindows:
                case VirtualKey.RightWindows:
                    this.isWindowsPressed = true;
                    break;
            }

            var modifiers = OxyModifierKeys.None;
            if (this.isControlPressed)
            {
                modifiers |= OxyModifierKeys.Control;
            }

            if (this.isAltPressed)
            {
                modifiers |= OxyModifierKeys.Control;
            }

            if (this.isShiftPressed)
            {
                modifiers |= OxyModifierKeys.Shift;
            }

            if (this.isWindowsPressed)
            {
                modifiers |= OxyModifierKeys.Windows;
            }

            if (e.Handled)
            {
                return;
            }

            var args = new OxyKeyEventArgs
            {
                Key = e.Key.Convert(),
                ModifierKeys = modifiers,
            };

            e.Handled = this.ActualController.HandleKeyDown(this, args);
        }

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

        /// <summary>
        /// Called before the ManipulationStarted event occurs.
        /// </summary>
        /// <param name="e">Event data for the event.</param>
        protected override void OnManipulationStarted(ManipulationStartedRoutedEventArgs e)
        {
            e = e ?? throw new ArgumentNullException(nameof(e));

            base.OnManipulationStarted(e);

            if (e.Handled)
            {
                return;
            }

            if (e.PointerDeviceType == PointerDeviceType.Touch)
            {
                this.Focus(FocusState.Pointer);
                e.Handled = this.ActualController.HandleTouchStarted(this, e.ToTouchEventArgs(this));
            }
        }

        /// <summary>
        /// Called before the ManipulationDelta event occurs.
        /// </summary>
        /// <param name="e">Event data for the event.</param>
        protected override void OnManipulationDelta(ManipulationDeltaRoutedEventArgs e)
        {
            e = e ?? throw new ArgumentNullException(nameof(e));

            base.OnManipulationDelta(e);

            if (e.Handled)
            {
                return;
            }

            if (e.PointerDeviceType == PointerDeviceType.Touch)
            {
                e.Handled = this.ActualController.HandleTouchDelta(this, e.ToTouchEventArgs(this));
            }
        }

        /// <summary>
        /// Called before the ManipulationCompleted event occurs.
        /// </summary>
        /// <param name="e">Event data for the event.</param>
        protected override void OnManipulationCompleted(ManipulationCompletedRoutedEventArgs e)
        {
            e = e ?? throw new ArgumentNullException(nameof(e));

            base.OnManipulationCompleted(e);

            if (e.Handled)
            {
                return;
            }

            if (e.PointerDeviceType == PointerDeviceType.Touch)
            {
                e.Handled = this.ActualController.HandleTouchCompleted(this, e.ToTouchEventArgs(this));
            }
        }

        /// <summary>
        /// Called before the PointerPressed event occurs.
        /// </summary>
        /// <param name="e">Event data for the event.</param>
        protected override void OnPointerPressed(PointerRoutedEventArgs e)
        {
            e = e ?? throw new ArgumentNullException(nameof(e));

            base.OnPointerPressed(e);

            if (e.Handled)
            {
                return;
            }

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
        }

        /// <summary>
        /// Called before the PointerMoved event occurs.
        /// </summary>
        /// <param name="e">Event data for the event.</param>
        protected override void OnPointerMoved(PointerRoutedEventArgs e)
        {
            e = e ?? throw new ArgumentNullException(nameof(e));

            base.OnPointerMoved(e);

            if (e.Handled)
            {
                return;
            }

            if (e.Pointer.PointerDeviceType == PointerDeviceType.Mouse)
            {
                e.Handled = this.ActualController.HandleMouseMove(this, e.ToMouseEventArgs(this));
            }

            // Note: don't handle touch here, this is also handled when moving over when a touch device
        }

        /// <summary>
        /// Called before the PointerReleased event occurs.
        /// </summary>
        /// <param name="e">Event data for the event.</param>
        protected override void OnPointerReleased(PointerRoutedEventArgs e)
        {
            e = e ?? throw new ArgumentNullException(nameof(e));

            base.OnPointerReleased(e);

            if (e.Handled)
            {
                return;
            }

            if (e.Pointer.PointerDeviceType == PointerDeviceType.Mouse)
            {
                this.ReleasePointerCapture(e.Pointer);
                e.Handled = this.ActualController.HandleMouseUp(this, e.ToMouseEventArgs(this));
            }
            else if (e.Pointer.PointerDeviceType == PointerDeviceType.Touch)
            {
                e.Handled = this.ActualController.HandleTouchCompleted(this, e.ToTouchEventArgs(this));
            }
        }

        /// <summary>
        /// Called before the PointerWheelChanged event occurs.
        /// </summary>
        /// <param name="e">Event data for the event.</param>
        protected override void OnPointerWheelChanged(PointerRoutedEventArgs e)
        {
            e = e ?? throw new ArgumentNullException(nameof(e));

            base.OnPointerWheelChanged(e);

            if (e.Handled || !this.IsMouseWheelEnabled)
            {
                return;
            }

            e.Handled = this.ActualController.HandleMouseWheel(this, e.ToMouseWheelEventArgs(this));
        }

        /// <summary>
        /// Called before the PointerEntered event occurs.
        /// </summary>
        /// <param name="e">Event data for the event.</param>
        protected override void OnPointerEntered(PointerRoutedEventArgs e)
        {
            e = e ?? throw new ArgumentNullException(nameof(e));

            base.OnPointerEntered(e);
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
        protected override void OnPointerExited(PointerRoutedEventArgs e)
        {
            e = e ?? throw new ArgumentNullException(nameof(e));

            base.OnPointerExited(e);
            if (e.Handled)
            {
                return;
            }

            e.Handled = this.ActualController.HandleMouseLeave(this, e.ToMouseEventArgs(this));
        }
        
        /// <summary>
        /// A one time condition for update visuals so it is called no matter the state of the control
        /// Currently with out this, the plotview on Xamarin Forms UWP does not render until the app's window resizes
        /// </summary>
        private bool isUpdateVisualsCalledOnce;

        /// <summary>
        /// Provides the behavior for the Arrange pass of layout. Classes can override this method to define their own Arrange pass behavior.
        /// </summary>
        /// <param name="finalSize">The final area within the parent that this object should use to arrange itself and its children.</param>
        /// <returns>The actual size that is used after the element is arranged in layout.</returns>
        protected override Size ArrangeOverride(Size finalSize)
		{
			if (this.ActualWidth > 0 && this.ActualHeight > 0)
			{
				if (Interlocked.CompareExchange(ref this.isPlotInvalidated, 0, 1) == 1)
				{
					this.Render();
				}
			}

			//see summary for isUpdateVisualsCalledOnce
			if (!isUpdateVisualsCalledOnce)
			{
				this.Render();

				isUpdateVisualsCalledOnce = true;
			}

			return base.ArrangeOverride(finalSize);
		}

		/// <summary>
		/// Called when the <see cref="Model" /> property is changed.
		/// </summary>
		/// <param name="sender">The sender.</param>
		/// <param name="e">The <see cref="DependencyPropertyChangedEventArgs" /> instance containing the event data.</param>
		private static void ModelChanged(DependencyObject sender, DependencyPropertyChangedEventArgs e)
        {
            ((PlotView)sender).OnModelChanged();
        }

        /// <summary>
        /// Called when the control is loaded.
        /// </summary>
        /// <param name="sender">The sender.</param>
        /// <param name="e">The <see cref="RoutedEventArgs" /> instance containing the event data.</param>
        private void OnLoaded(object sender, RoutedEventArgs e)
        {
            // Make sure InvalidateArrange is called when the PlotView is invalidated
            Interlocked.Exchange(ref this.isPlotInvalidated, 0);
            this.InvalidatePlot();
        }

        /// <summary>
        /// Called when the size of the control is changed.
        /// </summary>
        /// <param name="sender">The sender.</param>
        /// <param name="e">The <see cref="SizeChangedEventArgs" /> instance containing the event data.</param>
        private void OnSizeChanged(object sender, SizeChangedEventArgs e)
        {
            this.InvalidatePlot(false);
        }
#endif

        /// <summary>
        /// Identifies the <see cref="TextMeasurementMethod"/> dependency property.
        /// </summary>
        public static readonly DependencyProperty TextMeasurementMethodProperty =
            DependencyProperty.Register(
                nameof(TextMeasurementMethod), typeof(TextMeasurementMethod), typeof(PlotViewBase), new PropertyMetadata(TextMeasurementMethod.TextBlock));


        /// <summary>
        /// Gets or sets a value indicating whether to disconnect the canvas while updating.
        /// </summary>
        /// <value><c>true</c> if canvas should be disconnected while updating; otherwise, <c>false</c>.</value>
        public bool DisconnectCanvasWhileUpdating { get; set; }

        /// <summary>
        /// Gets or sets the vertical zoom cursor.
        /// </summary>
        /// <value>The zoom vertical cursor.</value>
        public TextMeasurementMethod TextMeasurementMethod
        {
            get => (TextMeasurementMethod)this.GetValue(TextMeasurementMethodProperty);
            set => this.SetValue(TextMeasurementMethodProperty, value);
        }

        /// <summary>
        /// Gets the Canvas.
        /// </summary>
        protected Canvas? Canvas => this.plotPresenter as Canvas;

        /// <summary>
        /// Gets the CanvasRenderContext.
        /// </summary>
        private CanvasRenderContext? RenderContext => this.renderContext as CanvasRenderContext;

        /// <inheritdoc/>
        protected override void ClearBackground()
        {
            if (Canvas == null)
            {
                return;
            }

            this.Canvas.Children.Clear();

            if (this.ActualModel != null && this.ActualModel.Background.IsVisible())
            {
                this.Canvas.Background = this.ActualModel.Background.ToBrush();
            }
            else
            {
                this.Canvas.Background = null;
            }
        }

        /// <inheritdoc/>
        protected override FrameworkElement CreatePlotPresenter()
        {
            return new Canvas
            {
#if !HAS_WPF
                IsHitTestVisible = false,
#endif
            };
        }

        /// <inheritdoc/>
        protected override IRenderContext CreateRenderContext()
        {
            if (Canvas == null)
            {
                throw new InvalidOperationException("Canvas is null");
            }

            return new CanvasRenderContext(this.Canvas);
        }

#if HAS_WPF
        /// <inheritdoc/>
        protected override void OnRender(DrawingContext drawingContext)
        {
            this.Render();
            base.OnRender(drawingContext);
        }
#endif

        /// <inheritdoc/>
        protected override void RenderOverride()
        {
            if (RenderContext == null)
            {
                base.RenderOverride();
                return;
            }

            this.RenderContext.TextMeasurementMethod = this.TextMeasurementMethod;
            if (this.DisconnectCanvasWhileUpdating && grid != null)
            {
                // TODO: profile... not sure if this makes any difference
                var idx = this.grid.Children.IndexOf(this.plotPresenter);
                if (idx != -1)
                {
                    this.grid.Children.RemoveAt(idx);
                }

                base.RenderOverride();

                if (idx != -1)
                {
                    // reinsert the canvas again
                    this.grid.Children.Insert(idx, this.plotPresenter);
                }
            }
            else
            {
                base.RenderOverride();
            }
        }

#if HAS_WPF
        /// <inheritdoc/>
        protected override double UpdateDpi()
        {
            if (RenderContext == null)
            {
                throw new InvalidOperationException("RenderContext is null");
            }

            var scale = base.UpdateDpi();
            this.RenderContext.DpiScale = scale;
            this.RenderContext.VisualOffset = this.TransformToAncestor(this.GetAncestorVisualFromVisualTree(this)).Transform(default);
            return scale;
        }

        /// <summary>
        /// Performs the copy operation.
        /// </summary>
        /// <param name="sender">The sender.</param>
        /// <param name="e">The <see cref="System.Windows.Input.ExecutedRoutedEventArgs" /> instance containing the event data.</param>
        private void DoCopy(object sender, ExecutedRoutedEventArgs e)
        {
            if (ActualModel == null)
            {
                throw new InvalidOperationException("ActualModel is null");
            }

            var exporter = new PngExporter() { Width = (int)this.ActualWidth, Height = (int)this.ActualHeight };
            var bitmap = exporter.ExportToBitmap(this.ActualModel);
            Clipboard.SetImage(bitmap);
        }


        /// <summary>
        /// Returns a reference to the visual object that hosts the dependency object in the visual tree.
        /// </summary>
        /// <returns> The host window from the visual tree.</returns>
        private Visual GetAncestorVisualFromVisualTree(DependencyObject startElement)
        {

            DependencyObject child = startElement;
            DependencyObject parent = VisualTreeHelper.GetParent(child);
            while (parent != null)
            {
                child = parent;
                parent = VisualTreeHelper.GetParent(child);
            }

            return child is Visual visualChild ? visualChild : Window.GetWindow(this);
        }
#endif
    }
}