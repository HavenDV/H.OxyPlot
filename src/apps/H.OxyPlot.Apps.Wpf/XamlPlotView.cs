using OxyPlot;

namespace H.OxyPlot.Apps;

/// <summary>
/// Represents a PlotView which uses the XamlRenderContext for rendering.
/// </summary>
public class XamlPlotView : PlotView
{
    protected override IRenderContext CreateRenderContext()
    {
        return new XamlRenderContext(Canvas!);
    }
}
