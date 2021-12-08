// --------------------------------------------------------------------------------------------------------------------
// <copyright file="SvgExporter.cs" company="OxyPlot">
//   Copyright (c) 2014 OxyPlot contributors
// </copyright>
// <summary>
//   Provides functionality to export plots to scalable vector graphics using text measuring in WPF.
// </summary>
// --------------------------------------------------------------------------------------------------------------------

namespace OxyPlot
{
    /// <summary>
    /// Provides functionality to export plots to scalable vector graphics using text measuring in WPF.
    /// </summary>
    public class CanvasSvgExporter : OxyPlot.SvgExporter
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="SvgExporter" /> class.
        /// </summary>
        public CanvasSvgExporter()
        {
            this.TextMeasurer = new CanvasRenderContext(new Canvas());
        }
    }
}