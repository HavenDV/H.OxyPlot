﻿// --------------------------------------------------------------------------------------------------------------------
// <copyright file="CanvasRenderContext.cs" company="OxyPlot">
//   Copyright (c) 2014 OxyPlot contributors
// </copyright>
// <summary>
//   Implements <see cref="IRenderContext" /> for <see cref="System.Windows.Controls.Canvas" />.
// </summary>
// --------------------------------------------------------------------------------------------------------------------

using OxyPlot.Utilities;
using System.IO;

namespace OxyPlot
{
    /// <summary>
    /// Implements <see cref="IRenderContext" /> for <see cref="Canvas" />.
    /// </summary>
    public class CanvasRenderContext : ClippingRenderContext
    {
        /// <summary>
        /// The images in use
        /// </summary>
        private readonly HashSet<OxyImage> imagesInUse = new HashSet<OxyImage>();

        /// <summary>
        /// The image cache
        /// </summary>
        private readonly Dictionary<OxyImage, BitmapSource> imageCache = new Dictionary<OxyImage, BitmapSource>();

        /// <summary>
        /// The brush cache.
        /// </summary>
        private readonly Dictionary<OxyColor, Brush> brushCache = new Dictionary<OxyColor, Brush>();

        /// <summary>
        /// The font family cache
        /// </summary>
        private readonly Dictionary<string, FontFamily> fontFamilyCache = new Dictionary<string, FontFamily>();

        /// <summary>
        /// The canvas.
        /// </summary>
        private readonly Canvas canvas;

        /// <summary>
        /// The clip rectangle.
        /// </summary>
        private Rect? clip;

        /// <summary>
        /// The current tool tip
        /// </summary>
        private string currentToolTip = string.Empty;

        /// <summary>
        /// The dpi scale.
        /// </summary>
        public double DpiScale { get; set; } = 1;

        /// <summary>
        /// The visual offset relative to visual root.
        /// </summary>
        public Point VisualOffset { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="CanvasRenderContext" /> class.
        /// </summary>
        /// <param name="canvas">The canvas.</param>
        public CanvasRenderContext(Canvas canvas)
        {
            canvas = canvas ?? throw new ArgumentNullException(nameof(canvas));

            this.canvas = canvas;
#if HAS_WPF
            this.TextFormattingMode = TextFormattingMode.Display;
#endif
            this.TextMeasurementMethod = TextMeasurementMethod.TextBlock;
            this.RendersToScreen = true;
        }

        /// <summary>
        /// Gets or sets the text measurement method.
        /// </summary>
        /// <value>The text measurement method.</value>
        public TextMeasurementMethod TextMeasurementMethod { get; set; }

#if HAS_WPF
        /// <summary>
        /// Gets or sets the text formatting mode.
        /// </summary>
        /// <value>The text formatting mode. The default value is <see cref="System.Windows.Media.TextFormattingMode.Display"/>.</value>
        public TextFormattingMode TextFormattingMode { get; set; }
#endif

        ///<inheritdoc/>
        public override void DrawEllipse(OxyRect rect, OxyColor fill, OxyColor stroke, double thickness, EdgeRenderingMode edgeRenderingMode)
        {
#if HAS_WPF
            this.DrawEllipses(new[] { rect }, fill, stroke, thickness, edgeRenderingMode);
#else
            var el = this.CreateAndAdd<Ellipse>(rect.Left, rect.Top);

            if (stroke.IsVisible())
            {
                el.Stroke = new SolidColorBrush(stroke.ToColor());
                el.StrokeThickness = thickness;
            }

            if (fill.IsVisible())
            {
                el.Fill = new SolidColorBrush(fill.ToColor());
            }

            el.Width = rect.Width;
            el.Height = rect.Height;
            Canvas.SetLeft(el, rect.Left);
            Canvas.SetTop(el, rect.Top);
#endif
        }

        ///<inheritdoc/>
        public override void DrawEllipses(IList<OxyRect> rectangles, OxyColor fill, OxyColor stroke, double thickness, EdgeRenderingMode edgeRenderingMode)
        {
            rectangles = rectangles ?? throw new ArgumentNullException(nameof(rectangles));

            if (rectangles.Count == 0)
            {
                return;
            }

            var path = this.CreateAndAdd<Path>();
            SetStroke(path, stroke, thickness, edgeRenderingMode);
#if HAS_WPF
            if (!fill.IsUndefined())
            {
                path.Fill = this.GetCachedBrush(fill);
            }

            var isFilled = !fill.IsUndefined();
            var isStroke = !stroke.IsUndefined();
            var geometry = new StreamGeometry { FillRule = FillRule.Nonzero };
            using (var sgc = geometry.Open())
            {
                foreach (var rect in rectangles)
                {
                    var centerY = rect.Center.Y;
                    sgc.BeginFigure(new Point(rect.Right, centerY), isFilled, true);

                    var size = new Size(rect.Width / 2, rect.Height / 2);
                    sgc.ArcTo(new Point(rect.Left, centerY), size, 180, false, SweepDirection.Clockwise, isStroke, false);
                    sgc.ArcTo(new Point(rect.Right, centerY), size, 180, false, SweepDirection.Clockwise, isStroke, false);
                }
            }

            geometry.Freeze();
#else
            if (fill.IsVisible())
            {
                path.Fill = this.GetCachedBrush(fill);
            }

            var geometry = new GeometryGroup { FillRule = FillRule.Nonzero };
            foreach (var rect in rectangles)
            {
                geometry.Children.Add(
                    new EllipseGeometry
                    {
                        Center = new Point(rect.Left + (rect.Width / 2), rect.Top + (rect.Height / 2)),
                        RadiusX = rect.Width / 2,
                        RadiusY = rect.Height / 2
                    });
            }
#endif
            path.Data = geometry;
        }

        ///<inheritdoc/>
        public override void DrawLine(
            IList<ScreenPoint> points,
            OxyColor stroke,
            double thickness,
            EdgeRenderingMode edgeRenderingMode,
            double[] dashArray,
            LineJoin lineJoin)
        {
            points = points ?? throw new ArgumentNullException(nameof(points));

            if (points.Count < 2)
            {
                return;
            }

#if HAS_WPF
            var path = this.CreateAndAdd<Path>();
            this.SetStroke(path, stroke, thickness, edgeRenderingMode, lineJoin, dashArray);

            var actualStrokeThickness = this.GetActualStrokeThickness(thickness, edgeRenderingMode);

            var actualPoints = this.GetActualPoints(points, actualStrokeThickness, edgeRenderingMode);
            var firstPoint = GetFirstAndRest(actualPoints, out var otherPoints);

            var streamGeometry = new StreamGeometry();
            using (var streamGeometryContext = streamGeometry.Open())
            {
                streamGeometryContext.BeginFigure(firstPoint, false, false);
                streamGeometryContext.PolyLineTo(otherPoints, !stroke.IsUndefined(), false);
            }

            streamGeometry.Freeze();
            path.Data = streamGeometry;
#else
            var aliased = edgeRenderingMode == EdgeRenderingMode.PreferSpeed;
            var e = this.CreateAndAdd<Polyline>();

            this.SetStroke(e, stroke, thickness, edgeRenderingMode, lineJoin, dashArray, 0);

            var pc = new PointCollection();
            foreach (var p in points)
            {
                pc.Add(p.ToPoint(aliased));
            }

            e.Points = pc;
#endif
        }

        ///<inheritdoc/>
        public override void DrawLineSegments(
            IList<ScreenPoint> points,
            OxyColor stroke,
            double thickness,
            EdgeRenderingMode edgeRenderingMode,
            double[] dashArray,
            LineJoin lineJoin)
        {
            points = points ?? throw new ArgumentNullException(nameof(points));

            if (points.Count < 2)
            {
                return;
            }

            var path = this.CreateAndAdd<Path>();
            this.SetStroke(path, stroke, thickness, edgeRenderingMode, lineJoin, dashArray, 0);
#if HAS_WPF
            var actualStrokeThickness = this.GetActualStrokeThickness(thickness, edgeRenderingMode);
            var actualPoints = this.GetActualPoints(points, actualStrokeThickness, edgeRenderingMode);
            var firstPoint = GetFirstAndRest(actualPoints, out var otherPoints);

            var streamGeometry = new StreamGeometry();
            using (var streamGeometryContext = streamGeometry.Open())
            {
                streamGeometryContext.BeginFigure(firstPoint, false, false);
                for (var i = 0; i < otherPoints.Count; i++)
                {
                    streamGeometryContext.LineTo(otherPoints[i], (i & 0x1) == 0, false);
                }
            }

            streamGeometry.Freeze();
            path.Data = streamGeometry;
#else
            var aliased = edgeRenderingMode == EdgeRenderingMode.PreferSpeed;
            var pg = new PathGeometry();
            for (int i = 0; i + 1 < points.Count; i += 2)
            {
                // if (points[i].Y==points[i+1].Y)
                // {
                // var line = new Line();

                // line.X1 = 0.5+(int)points[i].X;
                // line.X2 = 0.5+(int)points[i+1].X;
                // line.Y1 = 0.5+(int)points[i].Y;
                // line.Y2 = 0.5+(int)points[i+1].Y;
                // SetStroke(line, OxyColors.DarkRed, thickness, lineJoin, dashArray, aliased);
                // Add(line);
                // continue;
                // }
                var figure = new PathFigure { StartPoint = points[i].ToPoint(aliased), IsClosed = false };
                figure.Segments.Add(new LineSegment { Point = points[i + 1].ToPoint(aliased) });
                pg.Figures.Add(figure);
            }

            path.Data = pg;
#endif
        }

        ///<inheritdoc/>
        public override void DrawPolygon(
            IList<ScreenPoint> points,
            OxyColor fill,
            OxyColor stroke,
            double thickness,
            EdgeRenderingMode edgeRenderingMode,
            double[] dashArray,
            LineJoin lineJoin)
        {
            points = points ?? throw new ArgumentNullException(nameof(points));

            this.DrawPolygons(new[] { points }, fill, stroke, thickness, edgeRenderingMode, dashArray, lineJoin);

            // Old UWP code:
            //var po = this.CreateAndAdd<Polygon>();
            //var aliased = edgeRenderingMode == EdgeRenderingMode.PreferSpeed;

            //this.SetStroke(po, stroke, thickness, edgeRenderingMode, lineJoin, dashArray);

            //if (fill.IsVisible())
            //{
            //    po.Fill = this.GetCachedBrush(fill);
            //}

            //var pc = new PointCollection();
            //foreach (var p in points)
            //{
            //    pc.Add(p.ToPoint(aliased));
            //}

            //po.Points = pc;
        }

        ///<inheritdoc/>
        public override void DrawPolygons(
            IList<IList<ScreenPoint>> polygons,
            OxyColor fill,
            OxyColor stroke,
            double thickness,
            EdgeRenderingMode edgeRenderingMode,
            double[] dashArray,
            LineJoin lineJoin)
        {
            polygons = polygons ?? throw new ArgumentNullException(nameof(polygons));

            if (polygons.Count == 0)
            {
                return;
            }

            var path = this.CreateAndAdd<Path>();
            this.SetStroke(path, stroke, thickness, edgeRenderingMode, lineJoin, dashArray, 0);
            if (!fill.IsUndefined())
            {
                path.Fill = this.GetCachedBrush(fill);
            }

#if HAS_WPF
            var streamGeometry = new StreamGeometry { FillRule = FillRule.Nonzero };
            using (var sgc = streamGeometry.Open())
#else
            var streamGeometry = new PathGeometry { FillRule = FillRule.Nonzero };
#endif
            {
                foreach (var polygon in polygons)
                {
                    var points = this.GetActualPoints(polygon, path.StrokeThickness, edgeRenderingMode);
                    var firstPoint = GetFirstAndRest(points, out var otherPoints);

#if HAS_WPF
                    sgc.BeginFigure(firstPoint, !fill.IsUndefined(), true);
                    foreach (var point in otherPoints)
                    {
                        sgc.LineTo(point, !stroke.IsUndefined(), false);
                    }
#else
                    var figure = new PathFigure
                    { 
                        IsFilled = !fill.IsUndefined(),
                        IsClosed = true,
                    };
                    // https://github.com/oxyplot/oxyplot/issues/1848
                    figure.StartPoint = firstPoint;
                    foreach (var point in otherPoints)
                    {
                        figure.Segments.Add(new LineSegment { Point = point });
                    }
                    // https://github.com/HavenDV/H.OxyPlot/issues/5
                    //var collection = new PointCollection();
                    //foreach (var p in points)
                    //{
                    //    collection.Add(p);
                    //}
                    //collection.Add(firstPoint);

                    //figure.Segments.Add(new PolyLineSegment { Points = collection });

                    streamGeometry.Figures.Add(figure);
#endif
                }
            }

#if HAS_WPF
            streamGeometry.Freeze();
#endif

            path.Data = streamGeometry;
        }

        ///<inheritdoc/>
        public override void DrawRectangle(OxyRect rect, OxyColor fill, OxyColor stroke, double thickness, EdgeRenderingMode edgeRenderingMode)
        {
#if HAS_WPF
            this.DrawRectangles(new[] { rect }, fill, stroke, thickness, edgeRenderingMode);
#else
            var el = this.CreateAndAdd<Rectangle>(rect.Left, rect.Top);

            if (stroke.IsVisible())
            {
                el.Stroke = new SolidColorBrush(stroke.ToColor());
                el.StrokeThickness = thickness;
            }

            if (fill.IsVisible())
            {
                el.Fill = new SolidColorBrush(fill.ToColor());
            }

            el.Width = rect.Width;
            el.Height = rect.Height;
            Canvas.SetLeft(el, rect.Left);
            Canvas.SetTop(el, rect.Top);
#endif
        }

        ///<inheritdoc/>
        public override void DrawRectangles(IList<OxyRect> rectangles, OxyColor fill, OxyColor stroke, double thickness, EdgeRenderingMode edgeRenderingMode)
        {
            rectangles = rectangles ?? throw new ArgumentNullException(nameof(rectangles));

            if (rectangles.Count == 0)
            {
                return;
            }

            var path = this.CreateAndAdd<Path>();
            SetStroke(path, stroke, thickness, edgeRenderingMode);
            if (!fill.IsUndefined())
            {
                path.Fill = this.GetCachedBrush(fill);
            }

#if HAS_WPF
            var geometry = new StreamGeometry { FillRule = FillRule.Nonzero };
            using (var context = geometry.Open())
            {
                foreach (var rect in rectangles)
                {
                    var r = this.GetActualRect(rect, thickness, edgeRenderingMode);
                    context.BeginFigure(r.TopLeft, !fill.IsUndefined(), true);
                    context.PolyLineTo(new[] { r.TopRight, r.BottomRight, r.BottomLeft }, !stroke.IsUndefined(), false);
                }
            }

            geometry.Freeze();
#else
            var geometry = new GeometryGroup { FillRule = FillRule.Nonzero };
            foreach (var rect in rectangles)
            {
                geometry.Children.Add(new RectangleGeometry { Rect = rect.ToRect(true) });
            }
#endif

            path.Data = geometry;
        }

        ///<inheritdoc/>
        public override void DrawText(
            ScreenPoint p,
            string text,
            OxyColor fill,
            string fontFamily,
            double fontSize,
            double fontWeight,
            double rotate,
            HorizontalAlignment halign,
            VerticalAlignment valign,
            OxySize? maxSize)
        {
            var tb = this.CreateAndAdd<TextBlock>();
            tb.Text = text;
            tb.Foreground = this.GetCachedBrush(fill);

            // tb.SetValue(TextOptions.TextHintingModeProperty, TextHintingMode.Animated);

            if (fontFamily != null)
            {
                tb.FontFamily = this.GetCachedFontFamily(fontFamily);
            }
            if (fontSize > 0)
            {
                tb.FontSize = fontSize;
            }

            if (fontWeight > 0)
            {
                tb.FontWeight = GetFontWeight(fontWeight);
            }
#if HAS_WPF
            TextOptions.SetTextFormattingMode(tb, this.TextFormattingMode);
#endif
            double dx = 0;
            double dy = 0;

            if (maxSize != null || halign != HorizontalAlignment.Left || valign != VerticalAlignment.Top)
            {
                tb.Measure(new Size(1000, 1000));
                var size = tb.DesiredSize;
                if (maxSize != null)
                {
                    if (size.Width > maxSize.Value.Width + 1e-3)
                    {
                        size.Width = Math.Max(maxSize.Value.Width, 0);
                    }

                    if (size.Height > maxSize.Value.Height + 1e-3)
                    {
                        size.Height = Math.Max(maxSize.Value.Height, 0);
                    }

                    tb.Width = size.Width;
                    tb.Height = size.Height;
                }

                if (halign == HorizontalAlignment.Center)
                {
                    dx = -size.Width / 2;
                }

                if (halign == HorizontalAlignment.Right)
                {
                    dx = -size.Width;
                }

                if (valign == VerticalAlignment.Middle)
                {
                    dy = -size.Height / 2;
                }

                if (valign == VerticalAlignment.Bottom)
                {
                    dy = -size.Height;
                }
            }

            var transform = new TransformGroup();
            transform.Children.Add(new TranslateTransform { X = (int)dx, Y = (int)dy });
            if (Math.Abs(rotate) > double.Epsilon)
            {
                transform.Children.Add(new RotateTransform { Angle = rotate });
            }
            
            transform.Children.Add(new TranslateTransform { X = (int)p.X, Y = (int)p.Y });
            tb.RenderTransform = transform;
            if (tb.Clip != null)
            {
                tb.Clip.Transform = tb.RenderTransform.Inverse as Transform;
            }

#if HAS_WPF
            tb.SetValue(RenderOptions.ClearTypeHintProperty, ClearTypeHint.Enabled);
#endif
        }

        ///<inheritdoc/>
        public override OxySize MeasureText(string text, string fontFamily, double fontSize, double fontWeight)
        {
            if (string.IsNullOrEmpty(text))
            {
                return OxySize.Empty;
            }

#if HAS_WPF
            if (this.TextMeasurementMethod == TextMeasurementMethod.GlyphTypeface)
            {
                return MeasureTextByGlyphTypeface(text, fontFamily, fontSize, fontWeight);
            }
#endif

            var tb = new TextBlock { Text = text };

#if HAS_WPF
            TextOptions.SetTextFormattingMode(tb, this.TextFormattingMode);
#endif

            if (fontFamily != null)
            {
                tb.FontFamily = new FontFamily(fontFamily);
            }

            if (fontSize > 0)
            {
                tb.FontSize = fontSize;
            }

            if (fontWeight > 0)
            {
                tb.FontWeight = GetFontWeight(fontWeight);
            }

            tb.Measure(new Size(1000, 1000));

            return new OxySize(tb.DesiredSize.Width, tb.DesiredSize.Height);
        }

        ///<inheritdoc/>
        public override void SetToolTip(string text)
        {
            this.currentToolTip = text;
        }

        ///<inheritdoc/>
        public override void DrawImage(
            OxyImage source,
            double srcX,
            double srcY,
            double srcWidth,
            double srcHeight,
            double destX,
            double destY,
            double destWidth,
            double destHeight,
            double opacity,
            bool interpolate)
        {
            if (destWidth <= 0 || destHeight <= 0 || srcWidth <= 0 || srcHeight <= 0)
            {
                return;
            }

            var image = this.CreateAndAdd<Image>(destX, destY);
            var bitmapChain = this.GetImageSource(source);

            // ReSharper disable CompareOfFloatsByEqualityOperator
            if (srcX == 0 && srcY == 0 && srcWidth == bitmapChain.PixelWidth && srcHeight == bitmapChain.PixelHeight)
            // ReSharper restore CompareOfFloatsByEqualityOperator
            {
                // do not crop
            }
            else
            {
#if HAS_WPF
                bitmapChain = new CroppedBitmap(bitmapChain, new Int32Rect((int)srcX, (int)srcY, (int)srcWidth, (int)srcHeight));
#endif
            }

            image.Opacity = opacity;
            image.Width = destWidth;
            image.Height = destHeight;
            image.Stretch = Stretch.Fill;
#if HAS_WPF
            RenderOptions.SetBitmapScalingMode(image, interpolate ? BitmapScalingMode.HighQuality : BitmapScalingMode.NearestNeighbor);
#endif

            // Set the position of the image
            Canvas.SetLeft(image, destX);
            Canvas.SetTop(image, destY);
            //// alternative: image.RenderTransform = new TranslateTransform(destX, destY);
            //image.RenderTransform = new TranslateTransform { X = destX, Y = destY };

            image.Source = bitmapChain;
        }

        /// <inheritdoc/>
        protected override void SetClip(OxyRect clippingRectangle)
        {
#if HAS_WPF
            this.clip = ToRect(clippingRectangle);
#else
            this.clip = clippingRectangle.ToRect(false);
#endif
        }

        /// <inheritdoc/>
        protected override void ResetClip()
        {
            this.clip = null;
        }

        ///<inheritdoc/>
        public override void CleanUp()
        {
            // Find the images in the cache that has not been used since last call to this method
            var imagesToRelease = this.imageCache.Keys.Where(i => !this.imagesInUse.Contains(i)).ToList();

            // Remove the images from the cache
            foreach (var i in imagesToRelease)
            {
                this.imageCache.Remove(i);
            }

            this.imagesInUse.Clear();
        }

#if HAS_WPF
        /// <summary>
        /// Measures the size of the specified text by a faster method (using GlyphTypefaces).
        /// </summary>
        /// <param name="text">The text.</param>
        /// <param name="fontFamily">The font family.</param>
        /// <param name="fontSize">The font size.</param>
        /// <param name="fontWeight">The font weight.</param>
        /// <returns>The size of the text.</returns>
        protected static OxySize MeasureTextByGlyphTypeface(string text, string fontFamily, double fontSize, double fontWeight)
        {
            if (string.IsNullOrEmpty(text))
            {
                return OxySize.Empty;
            }

            var typeface = new Typeface(
                new FontFamily(fontFamily), FontStyles.Normal, GetFontWeight(fontWeight), FontStretches.Normal);

            if (!typeface.TryGetGlyphTypeface(out var glyphTypeface))
            {
                throw new InvalidOperationException("No glyph typeface found");
            }

            return MeasureTextSize(glyphTypeface, fontSize, text);
        }
#endif

        /// <summary>
        /// Gets the font weight.
        /// </summary>
        /// <param name="fontWeight">The font weight value.</param>
        /// <returns>The font weight.</returns>
        private static FontWeight GetFontWeight(double fontWeight)
        {
#if HAS_WPF
            return fontWeight > FontWeights.Normal ? System.Windows.FontWeights.Bold : System.Windows.FontWeights.Normal;
#elif HAS_WINUI
            return fontWeight > OxyPlot.FontWeights.Normal ? Microsoft.UI.Text.FontWeights.Bold : Microsoft.UI.Text.FontWeights.Normal;
#else
            return fontWeight > OxyPlot.FontWeights.Normal ? Windows.UI.Text.FontWeights.Bold : Windows.UI.Text.FontWeights.Normal;
#endif
        }

#if HAS_WPF
        /// <summary>
        /// Fast text size calculation
        /// </summary>
        /// <param name="glyphTypeface">The glyph typeface.</param>
        /// <param name="sizeInEm">The size.</param>
        /// <param name="s">The text.</param>
        /// <returns>The text size.</returns>
        private static OxySize MeasureTextSize(GlyphTypeface glyphTypeface, double sizeInEm, string s)
        {
            var width = 0d;
            var lineWidth = 0d;
            var lines = 0;
            foreach (var ch in s)
            {
                switch (ch)
                {
                    case '\n':
                        lines++;
                        if (lineWidth > width)
                        {
                            width = lineWidth;
                        }

                        lineWidth = 0;
                        continue;
                    case '\t':
                        continue;
                }

                var glyph = glyphTypeface.CharacterToGlyphMap[ch];
                var advanceWidth = glyphTypeface.AdvanceWidths[glyph];
                lineWidth += advanceWidth;
            }

            lines++;
            if (lineWidth > width)
            {
                width = lineWidth;
            }

            return new OxySize(Math.Round(width * sizeInEm, 2), Math.Round(lines * glyphTypeface.Height * sizeInEm, 2));
        }
#endif

        /// <summary>
        /// Creates an element of the specified type and adds it to the canvas.
        /// </summary>
        /// <typeparam name="T">Type of element to create.</typeparam>
        /// <param name="clipOffsetX">The clip offset executable.</param>
        /// <param name="clipOffsetY">The clip offset asynchronous.</param>
        /// <returns>The element.</returns>
        protected T CreateAndAdd<T>(double clipOffsetX = 0, double clipOffsetY = 0) where T : FrameworkElement, new()
        {
            // TODO: here we can reuse existing elements in the canvas.Children collection
            var element = new T();
#if !HAS_WPF
            element.CompositeMode = ElementCompositeMode.SourceOver;
#endif

            if (this.clip != null)
            {
                element.Clip = new RectangleGeometry
                {
                    Rect = new Rect(
                                this.clip.Value.X - clipOffsetX,
                                this.clip.Value.Y - clipOffsetY,
                                this.clip.Value.Width,
                                this.clip.Value.Height)
                };
            }

            this.canvas.Children.Add(element);

            this.ApplyToolTip(element);
            return element;
        }

        /// <summary>
        /// Applies the current tool tip to the specified element.
        /// </summary>
        /// <param name="element">The element.</param>
        private void ApplyToolTip(FrameworkElement element)
        {
            if (!string.IsNullOrEmpty(this.currentToolTip))
            {
#if HAS_WPF
                element.ToolTip = this.currentToolTip;
#else
                ToolTipService.SetToolTip(element, this.currentToolTip);
#endif
            }
        }


        /// <summary>
        /// Gets the cached brush.
        /// </summary>
        /// <param name="color">The color.</param>
        /// <returns>The brush.</returns>
        protected Brush? GetCachedBrush(OxyColor color)
        {
            if (color.A == 0)
            {
                return null;
            }

#if !HAS_WPF
#if HAS_WINUI
            if (Microsoft.UI.Xaml.Application.Current != null &&
                Microsoft.UI.Xaml.Application.Current.RequestedTheme == ApplicationTheme.Dark)
#else
            if (Windows.UI.Xaml.Application.Current != null &&
                Windows.UI.Xaml.Application.Current.RequestedTheme == ApplicationTheme.Dark)
#endif
            {
                if (color == OxyColors.Black)
                {
                    color = OxyColors.White;
                }
                else if (color == OxyColors.White)
                {
                    color = OxyColor.FromArgb(255, 32, 32, 32);
                }
            }
#endif

            if (!this.brushCache.TryGetValue(color, out var brush))
            {
                brush = new SolidColorBrush(color.ToColor());
#if HAS_WPF
                brush.Freeze();
#endif
                this.brushCache.Add(color, brush);
            }

            return brush;
        }

        /// <summary>
        /// Gets the cached font family.
        /// </summary>
        /// <param name="familyName">Name of the family.</param>
        /// <returns>The FontFamily.</returns>
        private FontFamily GetCachedFontFamily(string familyName)
        {
            familyName = familyName ?? throw new ArgumentNullException(nameof(familyName));

            if (!this.fontFamilyCache.TryGetValue(familyName, out var ff))
            {
                ff = new FontFamily(familyName);
                this.fontFamilyCache.Add(familyName, ff);
            }

            return ff;
        }

        /// <summary>
        /// Sets the stroke properties of the specified shape object.
        /// </summary>
        /// <param name="shape">The shape.</param>
        /// <param name="stroke">The stroke color.</param>
        /// <param name="thickness">The thickness.</param>
        /// <param name="edgeRenderingMode">The edge rendering mode.</param>
        /// <param name="lineJoin">The line join.</param>
        /// <param name="dashArray">The dash array. Use <c>null</c> to get a solid line.</param>
        /// <param name="dashOffset">The dash offset.</param>
        protected void SetStroke(
            Shape shape,
            OxyColor stroke,
            double thickness,
            EdgeRenderingMode edgeRenderingMode,
            LineJoin lineJoin = LineJoin.Miter,
            IEnumerable<double>? dashArray = null,
            double dashOffset = 0)
        {
            shape = shape ?? throw new ArgumentNullException(nameof(shape));

            if (!stroke.IsUndefined() && thickness > 0)
            {
                shape.Stroke = this.GetCachedBrush(stroke);

                switch (lineJoin)
                {
                    case LineJoin.Round:
                        shape.StrokeLineJoin = PenLineJoin.Round;
                        break;
                    case LineJoin.Bevel:
                        shape.StrokeLineJoin = PenLineJoin.Bevel;
                        break;

                    // The default StrokeLineJoin is Miter
                }

                shape.StrokeThickness = this.GetActualStrokeThickness(thickness, edgeRenderingMode);

                if (dashArray != null)
                {
#if HAS_WPF
                    shape.StrokeDashArray = new DoubleCollection(dashArray);
#else
                    shape.StrokeDashArray = new DoubleCollection();
                    foreach (double value in dashArray)
                    {
                        shape.StrokeDashArray.Add(value);
                    }
#endif
                    shape.StrokeDashOffset = dashOffset;
                }
            }
            else
            {
                shape.StrokeThickness = 0;
            }

            if (edgeRenderingMode == EdgeRenderingMode.PreferSpeed)
            {
#if HAS_WPF
                shape.SetValue(RenderOptions.EdgeModeProperty, EdgeMode.Aliased);
                shape.SnapsToDevicePixels = true;
#else
                shape.UseLayoutRounding = true;
#endif
            }
        }

        /// <summary>
        /// Gets the bitmap source.
        /// </summary>
        /// <param name="image">The image.</param>
        /// <returns>The bitmap source.</returns>
        private BitmapSource GetImageSource(OxyImage image)
        {
            image = image ?? throw new ArgumentNullException(nameof(image));

            if (!this.imagesInUse.Contains(image))
            {
                this.imagesInUse.Add(image);
            }

            if (this.imageCache.TryGetValue(image, out var src))
            {
                return src;
            }

            var bytes = image.GetData();
#if HAS_WPF
            using var stream = new MemoryStream(bytes);

            var bitmapImage = new BitmapImage();
            bitmapImage.BeginInit();
            bitmapImage.StreamSource = stream;
            bitmapImage.CacheOption = BitmapCacheOption.OnLoad;
            bitmapImage.EndInit();
            bitmapImage.Freeze();
#else
            using var stream = new MemoryStream();
            stream.Write(bytes, 0, bytes.Length);
            stream.Seek(0, SeekOrigin.Begin);

            var bitmapImage = new BitmapImage();
            bitmapImage.SetSource(stream.AsRandomAccessStream());
#endif

            this.imageCache.Add(image, bitmapImage);

            return bitmapImage;
        }

        /// <summary>
        /// Converts an <see cref="OxyRect" /> to a Rect.
        /// </summary>
        /// <param name="r">The rectangle.</param>
        /// <returns>A Rect.</returns>
        protected static Rect ToRect(OxyRect r)
        {
            return new Rect(r.Left, r.Top, r.Width, r.Height);
        }

        /// <summary>
        /// Snaps points to pixels if required by the edge rendering mode.
        /// </summary>
        /// <param name="points">The points.</param>
        /// <param name="strokeThickness">The stroke thickness.</param>
        /// <param name="edgeRenderingMode">The edge rendering mode.</param>
        /// <returns>The processed points.</returns>
        protected IEnumerable<Point> GetActualPoints(IList<ScreenPoint> points, double strokeThickness, EdgeRenderingMode edgeRenderingMode)
        {
            switch (edgeRenderingMode)
            {
                case EdgeRenderingMode.Adaptive when IsStraightLine(points):
                case EdgeRenderingMode.Automatic when IsStraightLine(points):
                case EdgeRenderingMode.PreferSharpness:
                    return points.Select(p => PixelLayout.Snap(p.X, p.Y, strokeThickness, this.VisualOffset, this.DpiScale));
                default:
                    return points.Select(p => new Point(p.X, p.Y));
            }
        }

        /// <summary>
        /// Snaps a rectangle to device pixels if required by the edge rendering mode.
        /// </summary>
        /// <param name="rect">The rectangle.</param>
        /// <param name="strokeThickness">The stroke thickness.</param>
        /// <param name="edgeRenderingMode">The edge rendering mode.</param>
        /// <returns>The processed rectangle.</returns>
        protected Rect GetActualRect(OxyRect rect, double strokeThickness, EdgeRenderingMode edgeRenderingMode)
        {
            switch (edgeRenderingMode)
            {
                case EdgeRenderingMode.PreferGeometricAccuracy:
                case EdgeRenderingMode.PreferSpeed:
                    return ToRect(rect);
                default:
                    return PixelLayout.Snap(ToRect(rect), strokeThickness, this.VisualOffset, this.DpiScale);
            }
        }

        /// <summary>
        /// Snaps a stroke thickness to device pixels if required by the edge rendering mode.
        /// </summary>
        /// <param name="strokeThickness">The stroke thickness.</param>
        /// <param name="edgeRenderingMode">The edge rendering mode.</param>
        /// <returns>The processed stroke thickness.</returns>
        protected double GetActualStrokeThickness(double strokeThickness, EdgeRenderingMode edgeRenderingMode)
        {
            switch (edgeRenderingMode)
            {
                case EdgeRenderingMode.PreferSharpness:
                    return PixelLayout.SnapStrokeThickness(strokeThickness, this.DpiScale);
                default:
                    return strokeThickness;
            }
        }

        private static T? GetFirstAndRest<T>(IEnumerable<T> items, out IList<T> rest)
        {
            using var e = items.GetEnumerator();
            if (!e.MoveNext())
            {
#if NET451
                rest = new T[0];
#else
                rest = Array.Empty<T>();
#endif
                return default;
            }

            var ret = e.Current;

            rest = new List<T>();
            while (e.MoveNext())
            {
                rest.Add(e.Current);
            }

            return ret;
        }
    }
}
