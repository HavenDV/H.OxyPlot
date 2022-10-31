# [H.OxyPlot](https://github.com/HavenDV/H.OxyPlot/) 

[![Language](https://img.shields.io/badge/language-C%23-blue.svg?style=flat-square)](https://github.com/HavenDV/H.OxyPlot/search?l=C%23&o=desc&s=&type=Code) 
[![License](https://img.shields.io/github/license/HavenDV/H.OxyPlot.svg?label=License&maxAge=86400)](LICENSE.md) 
[![Build Status](https://github.com/HavenDV/H.OxyPlot/actions/workflows/dotnet.yml/badge.svg)](https://github.com/HavenDV/H.OxyPlot/actions/workflows/dotnet.yml)

UWP/WinUI/Uno support for latest OxyPlot core library.  
It combines [the abandoned OxyPlot UWP code](https://github.com/oxyplot/oxyplot-uwp) 
with [the current WPF code](https://github.com/oxyplot/oxyplot/tree/develop/Source/OxyPlot.Wpf), 
trying to match the latter as closely as possible in behavior.

Additional features:
- Dark Theme support

### NuGet

[![NuGet](https://img.shields.io/nuget/dt/H.OxyPlot.Uno.svg?style=flat-square&label=H.OxyPlot.Uno)](https://www.nuget.org/packages/H.OxyPlot.Uno/)  
[![NuGet](https://img.shields.io/nuget/dt/H.OxyPlot.Uno.WinUI.svg?style=flat-square&label=H.OxyPlot.Uno.WinUI)](https://www.nuget.org/packages/H.OxyPlot.Uno.WinUI/)  
[![NuGet](https://img.shields.io/nuget/dt/H.OxyPlot.Uwp.svg?style=flat-square&label=H.OxyPlot.Uwp)](https://www.nuget.org/packages/H.OxyPlot.Uwp/)  
[![NuGet](https://img.shields.io/nuget/dt/H.OxyPlot.WinUI.svg?style=flat-square&label=H.OxyPlot.WinUI)](https://www.nuget.org/packages/H.OxyPlot.WinUI/)  

```
Install-Package H.OxyPlot.Uno
Install-Package H.OxyPlot.Uno.WinUI
Install-Package H.OxyPlot.Uwp
Install-Package H.OxyPlot.WinUI
```

### Usage

```
xmlns:oxy="using:OxyPlot"
```
```xml
<oxy:PlotView Model="{Binding Model}"/>
```

### Preview
There's a test application there:
https://havendv.github.io/H.OxyPlot/
<img width="1717" alt="image" src="https://user-images.githubusercontent.com/3002068/199105117-46f43272-d85c-4f5b-bfb3-7bd49a88fec1.png">

## Contacts
* [mail](mailto:havendv@gmail.com)
