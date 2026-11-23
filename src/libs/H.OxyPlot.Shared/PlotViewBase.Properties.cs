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
    [DependencyProperty<IPlotController>("Controller",
        Description = "Gets or sets the Plot controller.")]
#if HAS_UNO
    [DependencyProperty<object>("DefaultTrackerTemplate",
        Description = "Gets or sets the default tracker template.")]
#else
    [DependencyProperty<ControlTemplate>("DefaultTrackerTemplate",
        Description = "Gets or sets the default tracker template.")]
#endif
    [DependencyProperty<bool>("IsMouseWheelEnabled", DefaultValue = true,
        Description = "Gets or sets a value indicating whether IsMouseWheelEnabled.")]
    [DependencyProperty<PlotModel>("Model",
        Description = "Gets or sets the model.")]
    [DependencyProperty<Cursor>("PanCursor",
        DefaultValueExpression = "Cursors.Hand",
        Description = "Gets or sets the pan cursor.")]
    [DependencyProperty<Cursor>("ZoomHorizontalCursor",
#if HAS_WPF
        DefaultValueExpression = "Cursors.SizeWE",
#else
        DefaultValueExpression = "Cursors.SizeWestEast",
#endif
        Description = "Gets or sets the horizontal zoom cursor.")]
    [DependencyProperty<Cursor>("ZoomRectangleCursor",
#if HAS_WPF
        DefaultValueExpression = "Cursors.SizeNWSE",
#else
        DefaultValueExpression = "Cursors.SizeNorthwestSoutheast",
#endif
        Description = "Gets or sets the rectangle zoom cursor.")]
#if HAS_UNO
    [DependencyProperty<object>("ZoomRectangleTemplate",
        Description = "Gets or sets the zoom rectangle template.")]
#else
    [DependencyProperty<ControlTemplate>("ZoomRectangleTemplate",
        Description = "Gets or sets the zoom rectangle template.")]
#endif
    [DependencyProperty<Cursor>("ZoomVerticalCursor",
#if HAS_WPF
        DefaultValueExpression = "Cursors.SizeNS",
#else
        DefaultValueExpression = "Cursors.SizeNorthSouth",
#endif
        Description = "Gets or sets the vertical zoom cursor.")]
    public abstract partial class PlotViewBase
    {
    }
}
