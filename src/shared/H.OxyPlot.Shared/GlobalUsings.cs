#if HAS_WPF
global using System.Windows;
global using System.Windows.Controls;
#elif HAS_WINUI
global using Microsoft.UI.Xaml;
global using Microsoft.UI.Xaml.Controls;
#else
global using Windows.UI.Xaml;
global using Windows.UI.Xaml.Controls;
#endif