// --------------------------------------------------------------------------------------------------------------------
// <copyright file="PlotViewBase.cs" company="OxyPlot">
//   Copyright (c) 2020 OxyPlot contributors
// </copyright>
// --------------------------------------------------------------------------------------------------------------------

using OxyPlot.Controls;
using System.Collections.ObjectModel;
#if HAS_WPF
using System.Windows.Documents;
#endif

namespace OxyPlot
{

    /// <summary>
    /// Base class for WPF PlotView implementations.
    /// </summary>
    [TemplatePart(Name = PartGrid, Type = typeof(Grid))]
    public abstract partial class PlotViewBase : Control, IPlotView
    {
        /// <summary>
        /// The Grid PART constant.
        /// </summary>
        protected const string PartGrid = "PART_Grid";

#if !HAS_WPF
        /// <summary>
        /// The is PlotView invalidated.
        /// </summary>
#pragma warning disable CA1051 // Do not declare visible instance fields
        protected int isPlotInvalidated;
#pragma warning restore CA1051 // Do not declare visible instance fields
#endif

        /// <summary>
        /// The grid.
        /// </summary>
        protected Grid? grid { get; set; }

        /// <summary>
        /// The plot presenter.
        /// </summary>
        protected FrameworkElement? plotPresenter { get; set; }

        /// <summary>
        /// The render context
        /// </summary>
        protected IRenderContext? renderContext { get; set; }

        /// <summary>
        /// The model lock.
        /// </summary>
        private readonly object modelLock = new object();

        /// <summary>
        /// The current tracker.
        /// </summary>
        private FrameworkElement? currentTracker;

        /// <summary>
        /// The current tracker template.
        /// </summary>
        private ControlTemplate? currentTrackerTemplate;

        /// <summary>
        /// The default plot controller.
        /// </summary>
        private IPlotController? defaultController;

        /// <summary>
        /// Indicates whether the <see cref="PlotViewBase"/> was in the visual tree the last time <see cref="Render"/> was called.
        /// </summary>
        private bool isInVisualTree;

#if HAS_WPF
        /// <summary>
        /// The mouse down point.
        /// </summary>
        private ScreenPoint mouseDownPoint;
#endif

        /// <summary>
        /// The overlays.
        /// </summary>
        private Canvas? overlays;

        /// <summary>
        /// The zoom control.
        /// </summary>
        private ContentControl? zoomControl;

#if HAS_WPF
        /// <summary>
        /// Initializes static members of the <see cref="PlotViewBase" /> class.
        /// </summary>
        static PlotViewBase()
        {
            DefaultStyleKeyProperty.OverrideMetadata(typeof(PlotViewBase), new FrameworkPropertyMetadata(typeof(PlotViewBase)));
            PaddingProperty.OverrideMetadata(typeof(PlotViewBase), new FrameworkPropertyMetadata(new Thickness(8)));
        }
#endif

        /// <summary>
        /// Initializes a new instance of the <see cref="PlotViewBase" /> class.
        /// </summary>
        protected PlotViewBase()
        {
#if !HAS_WPF
            DefaultStyleKey = typeof(PlotViewBase);
            Padding = new Thickness(8);
#endif

#if HAS_WPF
            this.CommandBindings.Add(new CommandBinding(PlotUICommands.ResetAxes, (s, e) => this.ResetAllAxes()));
            this.IsManipulationEnabled = true;
            this.LayoutUpdated += this.OnLayoutUpdated;
#endif
        }

        /// <summary>
        /// Gets the actual PlotView controller.
        /// </summary>
        /// <value>The actual PlotView controller.</value>
        public IPlotController ActualController => this.Controller ?? (this.defaultController ??= new PlotController());

        /// <inheritdoc/>
        IController IView.ActualController => this.ActualController;

        /// <summary>
        /// Gets the actual model.
        /// </summary>
        /// <value>The actual model.</value>
        public PlotModel? ActualModel { get; private set; }

        /// <inheritdoc/>
        Model? IView.ActualModel => this.ActualModel;

        /// <summary>
        /// Gets the coordinates of the client area of the view.
        /// </summary>
        public OxyRect ClientArea => new OxyRect(0, 0, this.ActualWidth, this.ActualHeight);

        /// <summary>
        /// Gets the tracker definitions.
        /// </summary>
        /// <value>The tracker definitions.</value>
        public ObservableCollection<TrackerDefinition> TrackerDefinitions { get; } = new();

        /// <summary>
        /// Hides the tracker.
        /// </summary>
        public void HideTracker()
        {
            if (this.currentTracker != null)
            {
                if (overlays != null)
                {
                    this.overlays.Children.Remove(this.currentTracker);
                }
                this.currentTracker = null;
                this.currentTrackerTemplate = null;
            }
        }

        /// <summary>
        /// Hides the zoom rectangle.
        /// </summary>
        public void HideZoomRectangle()
        {
            if (zoomControl != null)
            {
                this.zoomControl.Visibility = Visibility.Collapsed;
            }
        }

        /// <summary>
        /// Invalidate the PlotView (not blocking the UI thread)
        /// </summary>
        /// <param name="updateData">The update Data.</param>
        public void InvalidatePlot(bool updateData = true)
        {
#if HAS_WPF
            if (DesignerProperties.GetIsInDesignMode(this))
#else
            if (DesignMode.DesignModeEnabled)
#endif
            {
                this.InvalidateArrange();
                return;
            }

            if (this.ActualModel != null)
            {
                lock (this.ActualModel.SyncRoot)
                {
                    ((IPlotModel)this.ActualModel).Update(updateData);
                }
            }

#if HAS_WPF
            this.BeginInvoke(this.Render);
#else
            if (Interlocked.CompareExchange(ref this.isPlotInvalidated, 1, 0) == 0)
            {
                // Invalidate the arrange state for the element.
                // After the invalidation, the element will have its layout updated,
                // which will occur asynchronously unless subsequently forced by UpdateLayout.
                this.BeginInvoke(this.InvalidateArrange);
            }
#endif
        }

        /// <inheritdoc/>
#if HAS_WPF
        public override void OnApplyTemplate()
#else
        protected override void OnApplyTemplate()
#endif
        {
            base.OnApplyTemplate();
            this.grid = this.GetTemplateChild(PartGrid) as Grid;
            if (this.grid == null)
            {
                return;
            }

            this.plotPresenter = this.CreatePlotPresenter();
            this.grid.Children.Add(this.plotPresenter);
            this.plotPresenter.UpdateLayout();
            this.renderContext = this.CreateRenderContext();

            this.overlays = new Canvas();
            this.grid.Children.Add(this.overlays);

            this.zoomControl = new ContentControl();
#if HAS_WPF
            this.zoomControl.Focusable = false;
#endif
            this.overlays.Children.Add(this.zoomControl);

            // add additional grid on top of everthing else to fix issue of mouse events getting lost
            // it must be added last so it covers all other controls
            var mouseGrid = new Grid
            {
                Background = new SolidColorBrush(Colors.Transparent), // background must be set for hit test to work
            };
            this.grid.Children.Add(mouseGrid);
        }

#if HAS_WPF
        /// <summary>
        /// Pans all axes.
        /// </summary>
        /// <param name="delta">The delta.</param>
        public void PanAllAxes(Vector delta)
        {
            if (this.ActualModel != null)
            {
                this.ActualModel.PanAllAxes(delta.X, delta.Y);
            }

            this.InvalidatePlot(false);
        }
#endif

        /// <summary>
        /// Resets all axes.
        /// </summary>
        public void ResetAllAxes()
        {
            if (this.ActualModel != null)
            {
                this.ActualModel.ResetAllAxes();
            }

            this.InvalidatePlot(false);
        }

        /// <summary>
        /// Stores text on the clipboard.
        /// </summary>
        /// <param name="text">The text.</param>
        public void SetClipboardText(string text)
        {
#if HAS_WPF
            Clipboard.SetText(text);
#else
            var pkg = new DataPackage();
            pkg.SetText(text);

            // TODO: Clipboard.SetContent(pkg);
#endif
        }

        /// <summary>
        /// Sets the cursor type.
        /// </summary>
        /// <param name="cursorType">The cursor type.</param>
        public void SetCursorType(CursorType cursorType)
        {
#if false
        /// <summary>
        /// Flags if the cursor is not implemented (Windows Phone).
        /// </summary>
        private static bool cursorNotImplemented;

            if (cursorNotImplemented)
            {
                // setting the cursor has failed in a previous attempt, see code below
                return;
            }

            var type = CoreCursorType.Arrow;
            switch (cursorType)
            {
                case CursorType.Default:
                    type = CoreCursorType.Arrow;
                    break;
                case CursorType.Pan:
                    type = CoreCursorType.Hand;
                    break;
                case CursorType.ZoomHorizontal:
                    type = CoreCursorType.SizeWestEast;
                    break;
                case CursorType.ZoomVertical:
                    type = CoreCursorType.SizeNorthSouth;
                    break;
                case CursorType.ZoomRectangle:
                    type = CoreCursorType.SizeNorthwestSoutheast;
                    break;
            }

            // TODO: determine if creating a CoreCursor is possible, do not use exception
            try
            {
                var newCursor = new CoreCursor(type, 1); // this line throws an exception on Windows Phone
#if HAS_WINUI
                global::Microsoft.UI.Xaml.Window.Current.CoreWindow.PointerCursor = newCursor;
#else
                global::Windows.UI.Xaml.Window.Current.CoreWindow.PointerCursor = newCursor;
#endif
            }
            catch (NotImplementedException)
            {
                cursorNotImplemented = true;
            }
#endif
            var cursor = cursorType switch
            {
                CursorType.Pan => PanCursor,
                CursorType.ZoomRectangle => ZoomRectangleCursor,
                CursorType.ZoomHorizontal => ZoomHorizontalCursor,
                CursorType.ZoomVertical => ZoomVerticalCursor,
                _ => Cursors.Arrow,
            };
#if HAS_WPF
            this.Cursor = cursor;
#elif !HAS_UNO || !HAS_WINUI
            FrameworkElementExtensions.SetCursor(this, cursor);
#endif
        }

        /// <summary>
        /// Shows the tracker.
        /// </summary>
        /// <param name="trackerHitResult">The tracker data.</param>
        public void ShowTracker(TrackerHitResult trackerHitResult)
        {
            if (trackerHitResult == null)
            {
                this.HideTracker();
                return;
            }

            var trackerTemplate = this.DefaultTrackerTemplate;
            if (trackerHitResult.Series != null && !string.IsNullOrEmpty(trackerHitResult.Series.TrackerKey))
            {
                var match = this.TrackerDefinitions.FirstOrDefault(t => t.TrackerKey == trackerHitResult.Series.TrackerKey);
                if (match != null)
                {
                    trackerTemplate = match.TrackerTemplate;
                }
            }

            if (trackerTemplate == null)
            {
                this.HideTracker();
                return;
            }

            if (!ReferenceEquals(trackerTemplate, this.currentTrackerTemplate))
            {
                this.HideTracker();

                var tracker = new ContentControl { Template = trackerTemplate };
                if (overlays != null)
                {
                    this.overlays.Children.Add(tracker);
                } 
                this.currentTracker = tracker;
                this.currentTrackerTemplate = trackerTemplate;
            }

            if (this.currentTracker != null)
            {
                this.currentTracker.DataContext = trackerHitResult;
            }
        }

        /// <summary>
        /// Shows the zoom rectangle.
        /// </summary>
        /// <param name="rectangle">The rectangle.</param>
        public void ShowZoomRectangle(OxyRect rectangle)
        {
            if (zoomControl == null)
            {
                return;
            }

            this.zoomControl.Width = rectangle.Width;
            this.zoomControl.Height = rectangle.Height;
            Canvas.SetLeft(this.zoomControl, rectangle.Left);
            Canvas.SetTop(this.zoomControl, rectangle.Top);
            this.zoomControl.Template = this.ZoomRectangleTemplate;
            this.zoomControl.Visibility = Visibility.Visible;
        }

        /// <summary>
        /// Zooms all axes.
        /// </summary>
        /// <param name="factor">The zoom factor.</param>
        public void ZoomAllAxes(double factor)
        {
            if (this.ActualModel != null)
            {
                this.ActualModel.ZoomAllAxes(factor);
            }

            this.InvalidatePlot(false);
        }

        /// <summary>
        /// Clears the background of the plot presenter.
        /// </summary>
        protected abstract void ClearBackground();

        /// <summary>
        /// Creates the plot presenter.
        /// </summary>
        /// <returns>The plot presenter.</returns>
        protected abstract FrameworkElement CreatePlotPresenter();

        /// <summary>
        /// Creates the render context.
        /// </summary>
        /// <returns>The render context.</returns>
        protected abstract IRenderContext CreateRenderContext();

        /// <summary>
        /// Called when the model is changed.
        /// </summary>
        partial void OnModelChanged(PlotModel? oldValue, PlotModel? newValue)
        {
            lock (this.modelLock)
            {
                if (this.ActualModel != null)
                {
                    ((IPlotModel)this.ActualModel).AttachPlotView(null);
                    this.ActualModel = null;
                }

                if (this.Model != null)
                {
                    ((IPlotModel)this.Model).AttachPlotView(this);
                    this.ActualModel = this.Model;
                }
            }

            this.InvalidatePlot();
        }

        /// <summary>
        /// Renders the plot model to the plot presenter.
        /// </summary>
        protected void Render()
        {
            if (this.plotPresenter == null || 
                this.renderContext == null || 
                !(this.isInVisualTree = this.IsInVisualTree()))
            {
                return;
            }

            this.RenderOverride();
        }

        /// <summary>
        /// Renders the plot model to the plot presenter.
        /// </summary>
        protected virtual void RenderOverride()
        {
            var dpiScale = this.UpdateDpi();
            this.ClearBackground();

            if (this.ActualModel != null && plotPresenter != null)
            {
                // round width and height to full device pixels
                var width = ((int)(this.plotPresenter.ActualWidth * dpiScale)) / dpiScale;
                var height = ((int)(this.plotPresenter.ActualHeight * dpiScale)) / dpiScale;

                lock (this.ActualModel.SyncRoot)
                {
                    ((IPlotModel)this.ActualModel).Render(this.renderContext, new OxyRect(0, 0, width, height));
                }
            }
        }

        /// <summary>
        /// Updates the DPI scale of the render context.
        /// </summary>
        /// <returns>The DPI scale.</returns>
        protected virtual double UpdateDpi()
        {
#if HAS_WPF
            var transformMatrix = PresentationSource.FromVisual(this)?.CompositionTarget?.TransformToDevice;
            var scale = transformMatrix == null ? 1 : (transformMatrix.Value.M11 + transformMatrix.Value.M22) / 2;
            return scale;
#else
            return 1.0;
#endif
        }

        /// <summary>
        /// Invokes the specified action on the dispatcher, if necessary.
        /// </summary>
        /// <param name="action">The action.</param>
#pragma warning disable CA1822 // Mark members as static
        private void BeginInvoke(Action action)
#pragma warning restore CA1822 // Mark members as static
        {
#if HAS_WPF
            if (!this.Dispatcher.CheckAccess())
            {
                this.Dispatcher.BeginInvoke(DispatcherPriority.Loaded, action);
            }
            else
#elif !HAS_WINUI && !HAS_UNO
            if (!this.Dispatcher.HasThreadAccess)
            {
                // TODO: Fix warning?
                // Because this call is not awaited, execution of the current method continues before the call is completed.
                // Consider applying the 'await' operator to the result of the call.
#pragma warning disable 4014
                this.Dispatcher.RunAsync(CoreDispatcherPriority.Low, () => action());
#pragma warning restore 4014
            }
            else
#endif
            {
                action();
            }
        }

        /// <summary>
        /// Gets a value indicating whether the <see cref="PlotViewBase"/> is connected to the visual tree.
        /// </summary>
        /// <returns><c>true</c> if the PlotViewBase is connected to the visual tree; <c>false</c> otherwise.</returns>
        private bool IsInVisualTree()
        {
            DependencyObject dpObject = this;
            while ((dpObject = VisualTreeHelper.GetParent(dpObject)) != null)
            {
#if HAS_WPF
                if (dpObject is Window)
                {
                    return true;
                }

                //Check if the parent is an AdornerDecorator like in an ElementHost
                if (dpObject is AdornerDecorator)
                {
                    return true;
                }

                //Check if the logical parent is a popup. If so, we found the popuproot
                var logicalRoot = LogicalTreeHelper.GetParent(dpObject);
                if (logicalRoot is Popup)
                {
                    return true;
                }
#else
                if (dpObject is Page ||
                    dpObject is Popup)
                {
                    return true;
                }
#endif
            }

            return false;
        }

        /// <summary>
        /// This event fires every time Layout updates the layout of the trees associated with current Dispatcher.
        /// </summary>
        /// <param name="sender">The sender.</param>
        /// <param name="e">The event args.</param>
        private void OnLayoutUpdated(object? sender, EventArgs e)
        {
            // if we were not in the visual tree the last time we tried to render but are now, we have to render
            if (!this.isInVisualTree && 
                this.IsInVisualTree())
            {
                this.Render();
            }
        }
    }
}
