# [H.OxyPlot](https://github.com/HavenDV/H.OxyPlot/) 

[![Language](https://img.shields.io/badge/language-C%23-blue.svg?style=flat-square)](https://github.com/HavenDV/H.OxyPlot/search?l=C%23&o=desc&s=&type=Code) 
[![License](https://img.shields.io/github/license/HavenDV/H.OxyPlot.svg?label=License&maxAge=86400)](LICENSE.md) 
[![Build Status](https://github.com/HavenDV/H.OxyPlot/actions/workflows/dotnet.yml/badge.svg)](https://github.com/HavenDV/H.OxyPlot/actions/workflows/dotnet.yml)

Shortest way to create rows/columns for Grid for WPF/UWP/Uno platforms

### NuGet

[![NuGet](https://img.shields.io/nuget/dt/H.OxyPlot.Wpf.svg?style=flat-square&label=H.OxyPlot.Wpf)](https://www.nuget.org/packages/H.OxyPlot.Wpf/)
[![NuGet](https://img.shields.io/nuget/dt/H.OxyPlot.Uno.svg?style=flat-square&label=H.OxyPlot.Uno)](https://www.nuget.org/packages/H.OxyPlot.Uno/)
[![NuGet](https://img.shields.io/nuget/dt/H.OxyPlot.Uwp.svg?style=flat-square&label=H.OxyPlot.Uwp)](https://www.nuget.org/packages/H.OxyPlot.Uwp/)

```
Install-Package H.OxyPlot.Wpf
Install-Package H.OxyPlot.Uno
Install-Package H.OxyPlot.Uwp
```

## Usage

### GridExtensions
```
// WPF
xmlns:e="clr-namespace:H.OxyPlot;assembly=H.OxyPlot.Wpf" 
// UWP/Uno
xmlns:e="using:H.OxyPlot"
```
```xml
<!-- Auto,Auto,*,Auto,Auto -->
<Grid e:GridExtensions.ColumnsAndRows="A,A,*,A,A;A,A,*,A,A"/>
<!-- Auto[MinWidth: 300, MaxWidth: 400],* -->
<Grid e:GridExtensions.Rows="A[300-400],*"/>
<!-- Auto[MinWidth: 300],* -->
<Grid e:GridExtensions.Rows="A[300],*"/>
<!-- Auto[MaxWidth: 300],* -->
<Grid e:GridExtensions.Rows="A[0-300],*"/>
```

## Contacts
* [mail](mailto:havendv@gmail.com)