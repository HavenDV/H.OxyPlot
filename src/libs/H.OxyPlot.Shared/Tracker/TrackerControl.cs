﻿// --------------------------------------------------------------------------------------------------------------------
// <copyright file="TrackerControl.cs" company="OxyPlot">
//   Copyright (c) 2020 OxyPlot contributors
// </copyright>
// <summary>
//   The tracker control.
// </summary>
// --------------------------------------------------------------------------------------------------------------------

using OxyPlot.Utilities;

namespace OxyPlot.Controls
{
    /// <summary>
    /// The tracker control.
    /// </summary>
    [DependencyProperty<Visibility>("HorizontalLineVisibility", DefaultValue = Visibility.Visible)]
    [DependencyProperty<Visibility>("VerticalLineVisibility", DefaultValue = Visibility.Visible)]
    [DependencyProperty<double>("LineThickness", DefaultValue = 1.0)]
    [DependencyProperty<Brush>("LineStroke")]
    [DependencyProperty<OxyRect>("LineExtents")]
    [DependencyProperty<DoubleCollection>("LineDashArray")]
    [DependencyProperty<bool>("ShowPointer", DefaultValue = true)]
    [DependencyProperty<double>("Distance", DefaultValue = 7.0)]
    [DependencyProperty<bool>("CanCenterHorizontally", DefaultValue = true)]
    [DependencyProperty<bool>("CanCenterVertically", DefaultValue = true)]
    [DependencyProperty<ScreenPoint>("Position")]
#if HAS_WPF
    [DependencyProperty<EdgeMode>("BorderEdgeMode")]
    [DependencyProperty<double>("CornerRadius")]
#endif
    public partial class TrackerControl : ContentControl
    {
        /// <summary>
        /// The path part string.
        /// </summary>
        private const string PartPath = "PART_Path";

        /// <summary>
        /// The content part string.
        /// </summary>
        private const string PartContent = "PART_Content";

        /// <summary>
        /// The content container part string.
        /// </summary>
        private const string PartContentcontainer = "PART_ContentContainer";

        /// <summary>
        /// The horizontal line part string.
        /// </summary>
        private const string PartHorizontalline = "PART_HorizontalLine";

        /// <summary>
        /// The vertical line part string.
        /// </summary>
        private const string PartVerticalline = "PART_VerticalLine";

        /// <summary>
        /// The content.
        /// </summary>
        private ContentPresenter? content;

        /// <summary>
        /// The horizontal line.
        /// </summary>
        private Line? horizontalLine;

        /// <summary>
        /// The path.
        /// </summary>
        private Path? path;

        /// <summary>
        /// The content container.
        /// </summary>
        private Grid? contentContainer;

        /// <summary>
        /// The vertical line.
        /// </summary>
        private Line? verticalLine;

#if HAS_WPF
        /// <summary>
        /// Initializes static members of the <see cref = "TrackerControl" /> class.
        /// </summary>
        static TrackerControl()
        {
            DefaultStyleKeyProperty.OverrideMetadata(
                typeof(TrackerControl), new FrameworkPropertyMetadata(typeof(TrackerControl)));
        }

#else
        /// <summary>
        /// Initializes a new instance of the <see cref="TrackerControl" /> class.
        /// </summary>
        public TrackerControl()
        {
            this.DefaultStyleKey = typeof(TrackerControl);
        }
#endif

        /// <summary>
        /// When overridden in a derived class, is invoked whenever application code or internal processes call ApplyTemplate />.
        /// </summary>
#if HAS_WPF
        public override void OnApplyTemplate()
#else
        protected override void OnApplyTemplate()
#endif
        {
            base.OnApplyTemplate();
            this.path = this.GetTemplateChild(PartPath) as Path;
            this.content = this.GetTemplateChild(PartContent) as ContentPresenter;
            this.contentContainer = this.GetTemplateChild(PartContentcontainer) as Grid;
            this.horizontalLine = this.GetTemplateChild(PartHorizontalline) as Line;
            this.verticalLine = this.GetTemplateChild(PartVerticalline) as Line;

            if (this.contentContainer == null)
            {
                throw new InvalidOperationException($"The TrackerControl template must contain a content container with name +'{PartContentcontainer}'");
            }

            if (this.path == null)
            {
                throw new InvalidOperationException($"The TrackerControl template must contain a Path with name +'{PartPath}'");
            }

            if (this.content == null)
            {
                throw new InvalidOperationException($"The TrackerControl template must contain a ContentPresenter with name +'{PartContent}'");
            }

            this.UpdatePositionAndBorder();
        }

        /// <summary>
        /// Called when the position is changed.
        /// </summary>
        partial void OnPositionChanged(ScreenPoint oldValue, ScreenPoint newValue)
        {
            this.UpdatePositionAndBorder();
        }

        /// <summary>
        /// Update the position and border of the tracker.
        /// </summary>
        private void UpdatePositionAndBorder()
        {
            if (this.contentContainer == null)
            {
                return;
            }

            Canvas.SetLeft(this.contentContainer, this.Position.X);
            Canvas.SetTop(this.contentContainer, this.Position.Y);
            FrameworkElement? parent = this;
            while (!(parent is Canvas) && parent != null)
            {
                parent = VisualTreeHelper.GetParent(parent) as FrameworkElement;
            }

            if (parent == null)
            {
                return;
            }

            // throw new InvalidOperationException("The TrackerControl must have a Canvas parent.");
            double canvasWidth = parent.ActualWidth;
            double canvasHeight = parent.ActualHeight;

            if (content == null)
            {
                throw new InvalidOperationException("content is null");
            }
            this.content.Measure(new Size(canvasWidth, canvasHeight));
            this.content.Arrange(new Rect(0, 0, this.content.DesiredSize.Width, this.content.DesiredSize.Height));

            double contentWidth = this.content.DesiredSize.Width;
            double contentHeight = this.content.DesiredSize.Height;

            // Minimum allowed margins around the tracker
            const double MarginLimit = 10;

            var ha = OxyPlot.HorizontalAlignment.Center;
            if (this.CanCenterHorizontally)
            {
                if (this.Position.X - (contentWidth / 2) < MarginLimit)
                {
                    ha = OxyPlot.HorizontalAlignment.Left;
                }

                if (this.Position.X + (contentWidth / 2) > canvasWidth - MarginLimit)
                {
                    ha = OxyPlot.HorizontalAlignment.Right;
                }
            }
            else
            {
                ha = this.Position.X < canvasWidth / 2 ? OxyPlot.HorizontalAlignment.Left : OxyPlot.HorizontalAlignment.Right;
            }

            var va = OxyPlot.VerticalAlignment.Middle;
            if (this.CanCenterVertically)
            {
                if (this.Position.Y - (contentHeight / 2) < MarginLimit)
                {
                    va = OxyPlot.VerticalAlignment.Top;
                }

                if (ha == OxyPlot.HorizontalAlignment.Center)
                {
                    va = OxyPlot.VerticalAlignment.Bottom;
                    if (this.Position.Y - contentHeight < MarginLimit)
                    {
                        va = OxyPlot.VerticalAlignment.Top;
                    }
                }

                if (va == OxyPlot.VerticalAlignment.Middle && this.Position.Y + (contentHeight / 2) > canvasHeight - MarginLimit)
                {
                    va = OxyPlot.VerticalAlignment.Bottom;
                }

                if (va == OxyPlot.VerticalAlignment.Top && this.Position.Y + contentHeight > canvasHeight - MarginLimit)
                {
                    va = OxyPlot.VerticalAlignment.Bottom;
                }
            }
            else
            {
                va = this.Position.Y < canvasHeight / 2 ? OxyPlot.VerticalAlignment.Top : OxyPlot.VerticalAlignment.Bottom;
            }

            double dx = ha == OxyPlot.HorizontalAlignment.Center ? -0.5 : ha == OxyPlot.HorizontalAlignment.Left ? 0 : -1;
            double dy = va == OxyPlot.VerticalAlignment.Middle ? -0.5 : va == OxyPlot.VerticalAlignment.Top ? 0 : -1;

            if (path == null)
            {
                throw new InvalidOperationException("path is null");
            }
            this.path.Data = this.ShowPointer
                                 ? this.CreatePointerBorderGeometry(ha, va, contentWidth, contentHeight, out var margin)
                                 : this.CreateBorderGeometry(ha, va, contentWidth, contentHeight, out margin);

            this.content.Margin = margin;

            this.contentContainer.Measure(new Size(canvasWidth, canvasHeight));
            var contentSize = this.contentContainer.DesiredSize;

            this.contentContainer.RenderTransform = new TranslateTransform
            {
                X = dx * contentSize.Width,
                Y = dy * contentSize.Height
            };

#if HAS_WPF
            var pos = this.Position;
#else
            Point pos = this.Position.ToPoint(true);
#endif

            if (this.horizontalLine != null)
            {
                if (this.LineExtents.Width > 0)
                {
                    this.horizontalLine.X1 = this.LineExtents.Left;
                    this.horizontalLine.X2 = this.LineExtents.Right;
                }
                else
                {
                    this.horizontalLine.X1 = 0;
                    this.horizontalLine.X2 = canvasWidth;
                }

                this.horizontalLine.Y1 = pos.Y;
                this.horizontalLine.Y2 = pos.Y;
            }

            if (this.verticalLine != null)
            {
                if (this.LineExtents.Width > 0)
                {
                    this.verticalLine.Y1 = this.LineExtents.Top;
                    this.verticalLine.Y2 = this.LineExtents.Bottom;
                }
                else
                {
                    this.verticalLine.Y1 = 0;
                    this.verticalLine.Y2 = canvasHeight;
                }

                this.verticalLine.X1 = pos.X;
                this.verticalLine.X2 = pos.X;
            }
        }

        /// <summary>
        /// Create the border geometry.
        /// </summary>
        /// <param name="ha">The horizontal alignment.</param>
        /// <param name="va">The vertical alignment.</param>
        /// <param name="width">The width.</param>
        /// <param name="height">The height.</param>
        /// <param name="margin">The margin.</param>
        /// <returns>The border geometry.</returns>
        private Geometry CreateBorderGeometry(
            HorizontalAlignment ha, VerticalAlignment va, double width, double height, out Thickness margin)
        {
            double m = this.Distance;
            var rect = new Rect(
                ha == OxyPlot.HorizontalAlignment.Left ? m : 0, va == OxyPlot.VerticalAlignment.Top ? m : 0, width, height);
            margin = new Thickness(
                ha == OxyPlot.HorizontalAlignment.Left ? m : 0,
                va == OxyPlot.VerticalAlignment.Top ? m : 0,
                ha == OxyPlot.HorizontalAlignment.Right ? m : 0,
                va == OxyPlot.VerticalAlignment.Bottom ? m : 0);
            return new RectangleGeometry
            {
                Rect = rect,
#if HAS_WPF
                RadiusX = this.CornerRadius,
                RadiusY = this.CornerRadius,
#endif
            };
        }

        /// <summary>
        /// Create a border geometry with a 'pointer'.
        /// </summary>
        /// <param name="ha">The horizontal alignment.</param>
        /// <param name="va">The vertical alignment.</param>
        /// <param name="width">The width.</param>
        /// <param name="height">The height.</param>
        /// <param name="margin">The margin.</param>
        /// <returns>The border geometry.</returns>
        private Geometry? CreatePointerBorderGeometry(
            HorizontalAlignment ha, VerticalAlignment va, double width, double height, out Thickness margin)
        {
            Point[]? points = null;
            double m = this.Distance;
            margin = new Thickness();

            if (ha == OxyPlot.HorizontalAlignment.Center && va == OxyPlot.VerticalAlignment.Bottom)
            {
                double x0 = 0;
                double x1 = width;
                double x2 = (x0 + x1) / 2;
                double y0 = 0;
                double y1 = height;
                margin = new Thickness(0, 0, 0, m);
                points = new[]
                    {
                        new Point(x0, y0), new Point(x1, y0), new Point(x1, y1), new Point(x2 + (m / 2), y1),
                        new Point(x2, y1 + m), new Point(x2 - (m / 2), y1), new Point(x0, y1)
                    };
            }

            if (ha == OxyPlot.HorizontalAlignment.Center && va == OxyPlot.VerticalAlignment.Top)
            {
                double x0 = 0;
                double x1 = width;
                double x2 = (x0 + x1) / 2;
                double y0 = m;
                double y1 = m + height;
                margin = new Thickness(0, m, 0, 0);
                points = new[]
                    {
                        new Point(x0, y0), new Point(x2 - (m / 2), y0), new Point(x2, 0), new Point(x2 + (m / 2), y0),
                        new Point(x1, y0), new Point(x1, y1), new Point(x0, y1)
                    };
            }

            if (ha == OxyPlot.HorizontalAlignment.Left && va == OxyPlot.VerticalAlignment.Middle)
            {
                double x0 = m;
                double x1 = m + width;
                double y0 = 0;
                double y1 = height;
                double y2 = (y0 + y1) / 2;
                margin = new Thickness(m, 0, 0, 0);
                points = new[]
                    {
                        new Point(0, y2), new Point(x0, y2 - (m / 2)), new Point(x0, y0), new Point(x1, y0),
                        new Point(x1, y1), new Point(x0, y1), new Point(x0, y2 + (m / 2))
                    };
            }

            if (ha == OxyPlot.HorizontalAlignment.Right && va == OxyPlot.VerticalAlignment.Middle)
            {
                double x0 = 0;
                double x1 = width;
                double y0 = 0;
                double y1 = height;
                double y2 = (y0 + y1) / 2;
                margin = new Thickness(0, 0, m, 0);
                points = new[]
                    {
                        new Point(x1 + m, y2), new Point(x1, y2 + (m / 2)), new Point(x1, y1), new Point(x0, y1),
                        new Point(x0, y0), new Point(x1, y0), new Point(x1, y2 - (m / 2))
                    };
            }

            if (ha == OxyPlot.HorizontalAlignment.Left && va == OxyPlot.VerticalAlignment.Top)
            {
                m *= 0.67;
                double x0 = m;
                double x1 = m + width;
                double y0 = m;
                double y1 = m + height;
                margin = new Thickness(m, m, 0, 0);
                points = new[]
                    {
                        new Point(0, 0), new Point(m * 2, y0), new Point(x1, y0), new Point(x1, y1), new Point(x0, y1),
                        new Point(x0, m * 2)
                    };
            }

            if (ha == OxyPlot.HorizontalAlignment.Right && va == OxyPlot.VerticalAlignment.Top)
            {
                m *= 0.67;
                double x0 = 0;
                double x1 = width;
                double y0 = m;
                double y1 = m + height;
                margin = new Thickness(0, m, m, 0);
                points = new[]
                    {
                        new Point(x1 + m, 0), new Point(x1, y0 + m), new Point(x1, y1), new Point(x0, y1),
                        new Point(x0, y0), new Point(x1 - m, y0)
                    };
            }

            if (ha == OxyPlot.HorizontalAlignment.Left && va == OxyPlot.VerticalAlignment.Bottom)
            {
                m *= 0.67;
                double x0 = m;
                double x1 = m + width;
                double y0 = 0;
                double y1 = height;
                margin = new Thickness(m, 0, 0, m);
                points = new[]
                    {
                        new Point(0, y1 + m), new Point(x0, y1 - m), new Point(x0, y0), new Point(x1, y0),
                        new Point(x1, y1), new Point(x0 + m, y1)
                    };
            }

            if (ha == OxyPlot.HorizontalAlignment.Right && va == OxyPlot.VerticalAlignment.Bottom)
            {
                m *= 0.67;
                double x0 = 0;
                double x1 = width;
                double y0 = 0;
                double y1 = height;
                margin = new Thickness(0, 0, m, m);
                points = new[]
                    {
                        new Point(x1 + m, y1 + m), new Point(x1 - m, y1), new Point(x0, y1), new Point(x0, y0),
                        new Point(x1, y0), new Point(x1, y1 - m)
                    };
            }

            if (points == null)
            {
                return null;
            }

#if HAS_WPF
            var pc = new PointCollection(points.Length);
#else
            var pc = new PointCollection();
#endif
            foreach (var p in points)
            {
                pc.Add(p);
            }

            var segments = new PathSegmentCollection { new PolyLineSegment { Points = pc } };
            var pf = new PathFigure { StartPoint = points[0], Segments = segments, IsClosed = true };
            return new PathGeometry { Figures = new PathFigureCollection { pf } };
        }
    }
}
