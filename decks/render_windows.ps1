param(
    [Parameter(Mandatory = $true)][string]$Presentation,
    [Parameter(Mandatory = $true)][string]$OutputDirectory
)
$ErrorActionPreference = 'Stop'
$wasRunning = @(Get-Process POWERPNT -ErrorAction SilentlyContinue).Count -gt 0
$app = $null
$deck = $null
try {
    $app = New-Object -ComObject PowerPoint.Application
    $deck = $app.Presentations.Open($Presentation, $true, $false, $false)
    foreach ($slide in $deck.Slides) {
        $file = Join-Path $OutputDirectory ('s-{0:D3}.jpg' -f $slide.SlideIndex)
        $slide.Export($file, 'JPG', 1600, 900)
    }
}
finally {
    if ($null -ne $deck) {
        $deck.Close()
        [void][Runtime.InteropServices.Marshal]::ReleaseComObject($deck)
    }
    if ($null -ne $app) {
        if (-not $wasRunning) { $app.Quit() }
        [void][Runtime.InteropServices.Marshal]::ReleaseComObject($app)
    }
}
