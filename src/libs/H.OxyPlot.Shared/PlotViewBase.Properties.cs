// --------------------------------------------------------------------------------------------------------------------
// <copyright file="PlotViewBase.Properties.cs" company="OxyPlot">
//   Copyright (c) 2020 OxyPlot contributors
// </copyright>
// --------------------------------------------------------------------------------------------------------------------

namespace OxyPlot
{
    /// <summary>
    /// Base class for WPF PlotView implementations.
    /// </summary>
    [DependencyProperty<IPlotController>("Controller")]
    [DependencyProperty<ControlTemplate>("DefaultTrackerTemplate")]
    [DependencyProperty<bool>("IsMouseWheelEnabled", DefaultValue = true)]
    [DependencyProperty<PlotModel>("Model")]
    [DependencyProperty<Cursor>("PanCursor", DefaultValueExpression = "Cursors.Hand")]
    [DependencyProperty<Cursor>("ZoomHorizontalCursor",
#if HAS_WPF
        DefaultValueExpression = "Cursors.SizeWE"
#else
        DefaultValueExpression = "Cursors.SizeWestEast"
#endif
        )]
    [DependencyProperty<Cursor>("ZoomRectangleCursor",
#if HAS_WPF
        DefaultValueExpression = "Cursors.SizeNWSE"
#else
        DefaultValueExpression = "Cursors.SizeNorthwestSoutheast"
#endif
        )]
    [DependencyProperty<ControlTemplate>("ZoomRectangleTemplate")]
    [DependencyProperty<Cursor>("ZoomVerticalCursor",
#if HAS_WPF
        DefaultValueExpression = "Cursors.SizeNS"
#else
        DefaultValueExpression = "Cursors.SizeNorthSouth"
#endif
        )]
    public abstract partial class PlotViewBase
    {
    }
}
