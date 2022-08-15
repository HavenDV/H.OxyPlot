using ExampleLibrary;
using OxyPlot;
using CommunityToolkit.Mvvm.ComponentModel;

namespace H.OxyPlot.Apps.ViewModels;

public partial class MainViewModel : ObservableObject
{
    [ObservableProperty]
    private bool canTranspose;

    [ObservableProperty]
    private bool transposed;

    [ObservableProperty]
    private bool canReverse;

    [ObservableProperty]
    private bool reversed;

    [ObservableProperty]
    private string code = string.Empty;

    public IReadOnlyCollection<Renderer> Renderers => Enum
        .GetValues(typeof(Renderer))
        .Cast<Renderer>()
        .ToArray();

    [ObservableProperty]
    private Renderer selectedRenderer = Renderer.Canvas;

    [ObservableProperty]
    private IReadOnlyCollection<ExampleInfo> examples;

    [ObservableProperty]
    private ExampleInfo? selectedExample;

    [ObservableProperty]
    private PlotModel? plotModel;

    [ObservableProperty]
    private PlotModel? canvasModel;

    [ObservableProperty]
    private PlotModel? canvasXamlModel;

    [ObservableProperty]
    private PlotModel? skiaModel;

    public MainViewModel()
    {
        examples = ExampleLibrary.Examples
            .GetList()
            .OrderBy(e => e.Category)
            .ToArray();
        selectedExample = examples.First();
        UpdatePlotModel();
    }

    partial void OnSelectedRendererChanged(Renderer value)
    {
        (PlotModel as IPlotModel)?.AttachPlotView(null);
    }

    partial void OnTransposedChanged(bool value)
    {
        UpdatePlotModel();
    }

    partial void OnReversedChanged(bool value)
    {
        UpdatePlotModel();
    }

    partial void OnSelectedExampleChanged(ExampleInfo? value)
    {
        UpdatePlotModel();
    }

    private void UpdatePlotModel()
    {
        CanTranspose = SelectedExample?.IsTransposable == true;
        CanReverse = SelectedExample?.IsReversible == true;
        var flags = ExampleInfo.PrepareFlags(
            CanTranspose && Transposed,
            CanReverse && Reversed);

        PlotModel = SelectedExample?.GetModel(flags);
        SkiaModel = SelectedRenderer == Renderer.SkiaSharp ? PlotModel : null;
        CanvasXamlModel = SelectedRenderer == Renderer.Canvas_XAML ? PlotModel : null;
        CanvasModel = SelectedRenderer == Renderer.Canvas ? PlotModel : null;
        Code = SelectedExample?.GetCode(flags) ?? string.Empty;
        OnSelectedRendererChanged(SelectedRenderer);
    }
}