# VideoWebSite Launcher v1.2
# Run: powershell -ExecutionPolicy Bypass -File launcher.ps1

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$scriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$configFile = Join-Path $scriptDir "launcher_config.json"
$serverJs   = Join-Path $scriptDir "server.js"

$proc        = $null
$logTimer    = $null
$logOutFile  = $null
$logErrFile  = $null
$logOutPos   = 0
$logErrPos   = 0
$stopPending = $false

# ─── Config persistence ───
function Load-Config {
    if (Test-Path $configFile) {
        try { return Get-Content $configFile -Raw -Encoding UTF8 | ConvertFrom-Json } catch {}
    }
    return @{ port = 4007; paths = @() }
}
function Save-Config { param($cfg)
    try { $cfg | ConvertTo-Json -Depth 4 | Set-Content $configFile -Encoding UTF8 } catch {}
}

# ─── Build GUI ───
$cfg = Load-Config

$form = New-Object System.Windows.Forms.Form
$form.Text = "VideoWebSite Launcher"
$form.Size = New-Object System.Drawing.Size(720, 560)
$form.StartPosition = "CenterScreen"
$form.MinimumSize = New-Object System.Drawing.Size(600, 460)
if ($cfg.winWidth -and $cfg.winHeight) {
    $form.Size = New-Object System.Drawing.Size($cfg.winWidth, $cfg.winHeight)
}
if ($cfg.winX -and $cfg.winY) {
    $scr = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
    if ($cfg.winX -lt $scr.Width -and $cfg.winY -lt $scr.Height) {
        $form.StartPosition = "Manual"
        $form.Location = New-Object System.Drawing.Point($cfg.winX, $cfg.winY)
    }
}

$formClosed = $false
$form.Add_FormClosing({
    param($s, $e)
    if ($formClosed) { return }
    $formClosed = $true
    $cfg.winWidth  = $form.Width
    $cfg.winHeight = $form.Height
    $cfg.winX      = $form.Location.X
    $cfg.winY      = $form.Location.Y
    Stop-Server
    Save-Config $cfg
})

$mainLayout = New-Object System.Windows.Forms.TableLayoutPanel
$mainLayout.Dock = "Fill"
$mainLayout.ColumnCount = 1
$mainLayout.RowCount = 4
$mainLayout.Padding = New-Object System.Windows.Forms.Padding(12)
$mainLayout.RowStyles.Add((New-Object System.Windows.Forms.RowStyle("Absolute", 30)))
$mainLayout.RowStyles.Add((New-Object System.Windows.Forms.RowStyle("Percent", 100)))
$mainLayout.RowStyles.Add((New-Object System.Windows.Forms.RowStyle("Absolute", 64)))
$mainLayout.RowStyles.Add((New-Object System.Windows.Forms.RowStyle("Absolute", 100)))
$form.Controls.Add($mainLayout)

# ─── Row 0: Port + auto-open ───
$topBar = New-Object System.Windows.Forms.FlowLayoutPanel
$topBar.Dock = "Fill"
$topBar.WrapContents = $false

$portLabel = New-Object System.Windows.Forms.Label
$portLabel.Text = "Port:"
$portLabel.TextAlign = "MiddleLeft"
$portLabel.Height = 28
$portLabel.Width = 34
$topBar.Controls.Add($portLabel)

$portInput = New-Object System.Windows.Forms.NumericUpDown
$portInput.Minimum = 1
$portInput.Maximum = 65535
$portInput.Value = $cfg.port
$portInput.Width = 70
$portInput.Height = 24
$portInput.Add_ValueChanged({ $cfg.port = $portInput.Value })
$topBar.Controls.Add($portInput)

$autoOpenChk = New-Object System.Windows.Forms.CheckBox
$autoOpenChk.Text = "Auto-open browser on start"
$autoOpenChk.Checked = if ($null -ne $cfg.autoOpen) { $cfg.autoOpen } else { $true }
$autoOpenChk.AutoSize = $true
$autoOpenChk.Height = 28
$autoOpenChk.Add_CheckedChanged({ $cfg.autoOpen = $autoOpenChk.Checked })
$topBar.Controls.Add($autoOpenChk)

$mainLayout.Controls.Add($topBar, 0, 0)

# ─── Row 1: Path list ───
$pathGroup = New-Object System.Windows.Forms.GroupBox
$pathGroup.Text = " Video Directories "
$pathGroup.Dock = "Fill"
$pathGroup.Padding = New-Object System.Windows.Forms.Padding(8, 8, 8, 8)

$pathInner = New-Object System.Windows.Forms.TableLayoutPanel
$pathInner.Dock = "Fill"
$pathInner.ColumnCount = 1
$pathInner.RowCount = 2
$pathInner.RowStyles.Add((New-Object System.Windows.Forms.RowStyle("Percent", 100)))
$pathInner.RowStyles.Add((New-Object System.Windows.Forms.RowStyle("Absolute", 34)))
$pathGroup.Controls.Add($pathInner)

$listBox = New-Object System.Windows.Forms.ListBox
$listBox.Dock = "Fill"
$listBox.IntegralHeight = $false
$listBox.HorizontalScrollbar = $true
$listBox.Add_DoubleClick({
    $idx = $listBox.SelectedIndex
    if ($idx -ge 0) { Start-Process "explorer.exe" $listBox.Items[$idx] }
})
$pathInner.Controls.Add($listBox, 0, 0)
foreach ($p in $cfg.paths) { $listBox.Items.Add($p) | Out-Null }

$btnRow = New-Object System.Windows.Forms.FlowLayoutPanel
$btnRow.Dock = "Fill"
$btnRow.WrapContents = $false
$btnRow.Padding = New-Object System.Windows.Forms.Padding(0, 4, 0, 0)
$pathInner.Controls.Add($btnRow, 0, 1)

$btnAdd = New-Object System.Windows.Forms.Button
$btnAdd.Text = "+ Add Path"
$btnAdd.Width = 100
$btnAdd.Height = 28
$btnAdd.Add_Click({
    $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
    $dlg.Description = "Select a folder containing video files"
    $dlg.ShowNewFolderButton = $false
    if ($dlg.ShowDialog($form) -eq "OK") {
        $p = $dlg.SelectedPath
        if (-not $listBox.Items.Contains($p)) {
            $listBox.Items.Add($p) | Out-Null
            $cfg.paths = @($listBox.Items)
            Save-Config $cfg
            Update-VideoCount
        }
    }
})
$btnRow.Controls.Add($btnAdd)

$btnRemove = New-Object System.Windows.Forms.Button
$btnRemove.Text = "- Remove"
$btnRemove.Width = 80
$btnRemove.Height = 28
$btnRemove.Add_Click({
    $idx = $listBox.SelectedIndex
    if ($idx -ge 0) {
        $listBox.Items.RemoveAt($idx)
        $cfg.paths = @($listBox.Items)
        Save-Config $cfg
        Update-VideoCount
    }
})
$btnRow.Controls.Add($btnRemove)

$lblCount = New-Object System.Windows.Forms.Label
$lblCount.Text = ""
$lblCount.TextAlign = "MiddleLeft"
$lblCount.AutoSize = $true
$lblCount.Padding = New-Object System.Windows.Forms.Padding(10, 0, 0, 0)
$lblCount.Height = 28
$btnRow.Controls.Add($lblCount)

$mainLayout.Controls.Add($pathGroup, 0, 1)

# ─── Row 2: Controls ───
$ctrlPanel = New-Object System.Windows.Forms.GroupBox
$ctrlPanel.Text = " Controls "
$ctrlPanel.Dock = "Fill"
$ctrlPanel.Padding = New-Object System.Windows.Forms.Padding(8, 8, 8, 8)

$ctrlInner = New-Object System.Windows.Forms.FlowLayoutPanel
$ctrlInner.Dock = "Fill"
$ctrlInner.WrapContents = $false
$ctrlInner.Padding = New-Object System.Windows.Forms.Padding(0, 2, 0, 0)
$ctrlPanel.Controls.Add($ctrlInner)

$btnStart = New-Object System.Windows.Forms.Button
$btnStart.Text = "Start Server"
$btnStart.Width = 115
$btnStart.Height = 36
$btnStart.BackColor = [System.Drawing.Color]::FromArgb(76, 175, 80)
$btnStart.ForeColor = [System.Drawing.Color]::White
$btnStart.Font = New-Object System.Drawing.Font($btnStart.Font, [System.Drawing.FontStyle]::Bold)
$btnStart.Add_Click({ Start-Server })
$ctrlInner.Controls.Add($btnStart)

$btnStop = New-Object System.Windows.Forms.Button
$btnStop.Text = "Stop Server"
$btnStop.Width = 115
$btnStop.Height = 36
$btnStop.Enabled = $false
$btnStop.Add_Click({ Stop-Server })
$ctrlInner.Controls.Add($btnStop)

$btnOpen = New-Object System.Windows.Forms.Button
$btnOpen.Text = "Open Browser"
$btnOpen.Width = 115
$btnOpen.Height = 36
$btnOpen.Enabled = $false
$btnOpen.Add_Click({
    Start-Process "http://localhost:$($portInput.Value)"
})
$ctrlInner.Controls.Add($btnOpen)

$btnExport = New-Object System.Windows.Forms.Button
$btnExport.Text = "Export Config"
$btnExport.Width = 115
$btnExport.Height = 36
$btnExport.Add_Click({ Export-Config })
$ctrlInner.Controls.Add($btnExport)

$btnImport = New-Object System.Windows.Forms.Button
$btnImport.Text = "Import Config"
$btnImport.Width = 115
$btnImport.Height = 36
$btnImport.Add_Click({ Import-Config })
$ctrlInner.Controls.Add($btnImport)

$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = "  Idle"
$statusLabel.TextAlign = "MiddleLeft"
$statusLabel.AutoSize = $true
$statusLabel.Font = New-Object System.Drawing.Font($statusLabel.Font, [System.Drawing.FontStyle]::Bold)
$statusLabel.ForeColor = [System.Drawing.Color]::DarkGray
$statusLabel.Padding = New-Object System.Windows.Forms.Padding(12, 0, 0, 0)
$statusLabel.Height = 36
$ctrlInner.Controls.Add($statusLabel)

$mainLayout.Controls.Add($ctrlPanel, 0, 2)

# ─── Row 3: Log output ───
$logGroup = New-Object System.Windows.Forms.GroupBox
$logGroup.Text = " Server Output "
$logGroup.Dock = "Fill"
$logGroup.Padding = New-Object System.Windows.Forms.Padding(4, 4, 4, 4)
$mainLayout.Controls.Add($logGroup, 0, 3)

$logBox = New-Object System.Windows.Forms.RichTextBox
$logBox.Dock = "Fill"
$logBox.ReadOnly = $true
$logBox.BackColor = [System.Drawing.Color]::FromArgb(30, 30, 30)
$logBox.ForeColor = [System.Drawing.Color]::FromArgb(200, 200, 200)
$logBox.Font = New-Object System.Drawing.Font("Consolas", 9)
$logBox.WordWrap = $true
$logBox.Multiline = $true
$logBox.ScrollBars = "Vertical"
$logGroup.Controls.Add($logBox)

# ─── Functions ───
function Append-Log {
    param($text, $color = $null)
    if ($logBox.IsDisposed) { return }
    if ($logBox.TextLength -gt 50000) {
        $keep = [System.Math]::Max(0, $logBox.TextLength - 30000)
        $logBox.Select(0, $keep)
        $logBox.SelectedText = ""
    }
    $logBox.SelectionStart = $logBox.TextLength
    $logBox.SelectionLength = 0
    if ($color) { $logBox.SelectionColor = $color }
    $logBox.AppendText("$text`r`n")
    $logBox.ScrollToCaret()
}

function Set-Running {
    $btnStart.Enabled  = $false
    $btnStop.Enabled   = $true
    $btnOpen.Enabled   = $true
    $statusLabel.Text  = "  Running"
    $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(76, 175, 80)
    $listBox.Enabled   = $false
    $btnAdd.Enabled    = $false
    $btnRemove.Enabled = $false
    $btnExport.Enabled = $false
    $btnImport.Enabled = $false
    $portInput.Enabled = $false
}

function Set-Stopped {
    $btnStart.Enabled  = $true
    $btnStop.Enabled   = $false
    $btnOpen.Enabled   = $false
    $statusLabel.Text  = "  Idle"
    $statusLabel.ForeColor = [System.Drawing.Color]::DarkGray
    $listBox.Enabled   = $true
    $btnAdd.Enabled    = $true
    $btnRemove.Enabled = $true
    $btnExport.Enabled = $true
    $btnImport.Enabled = $true
    $portInput.Enabled = $true
}

function Update-VideoCount {
    $total = 0
    $VIDEO_EXT = @('.mp4','.mkv','.avi','.mov','.flv','.wmv','.webm','.ogg')
    foreach ($dir in $cfg.paths) {
        if (Test-Path $dir) {
            $total += (Get-ChildItem -LiteralPath $dir -Recurse -File -ErrorAction SilentlyContinue |
                       Where-Object { $VIDEO_EXT -contains $_.Extension.ToLower() }).Count
        }
    }
    if ($cfg.paths.Count -eq 0) {
        $lblCount.Text = ""
    } else {
        $lblCount.Text = "$total video(s) across $($cfg.paths.Count) path(s)"
    }
}

function Export-Config {
    $dlg = New-Object System.Windows.Forms.SaveFileDialog
    $dlg.Filter = "JSON files (*.json)|*.json|All files (*.*)|*.*"
    $dlg.DefaultExt = "json"
    $dlg.FileName = "videowebsite_config.json"
    $dlg.Title = "Export configuration"
    if ($dlg.ShowDialog($form) -eq "OK") {
        $export = @{
            port  = $portInput.Value
            paths = @($listBox.Items)
        }
        try {
            $export | ConvertTo-Json -Depth 4 | Set-Content $dlg.FileName -Encoding UTF8
            Append-Log "[EXPORT] Saved config to $($dlg.FileName)" ([System.Drawing.Color]::Green)
        } catch {
            [System.Windows.Forms.MessageBox]::Show("Failed to write file:`n$_", "Export Error", "OK", "Error")
        }
    }
}

function Import-Config {
    $dlg = New-Object System.Windows.Forms.OpenFileDialog
    $dlg.Filter = "JSON files (*.json)|*.json|All files (*.*)|*.*"
    $dlg.DefaultExt = "json"
    $dlg.Title = "Import configuration"
    if ($dlg.ShowDialog($form) -eq "OK") {
        try {
            $import = Get-Content $dlg.FileName -Raw -Encoding UTF8 | ConvertFrom-Json
            if ($null -eq $import) { throw "Empty or invalid JSON" }

            # Apply port
            if ($import.port -and [int]$import.port -ge 1 -and [int]$import.port -le 65535) {
                $portInput.Value = [int]$import.port
                $cfg.port = [int]$import.port
            }

            # Apply paths
            $listBox.Items.Clear()
            $rawPaths = if ($import.paths) { @($import.paths) } else { @() }
            $importPaths = @($rawPaths | Where-Object { $_ -and (Test-Path $_) })
            $skipped = $rawPaths.Count - $importPaths.Count
            foreach ($p in $importPaths) { $listBox.Items.Add($p) | Out-Null }
            $cfg.paths = @($listBox.Items)
            Save-Config $cfg
            Update-VideoCount

            Append-Log "[IMPORT] Loaded config from $($dlg.FileName)" ([System.Drawing.Color]::Green)
            Append-Log "          Port: $($cfg.port), Paths: $($importPaths.Count)" ([System.Drawing.Color]::Gray)
            if ($skipped -gt 0) {
                Append-Log "          Skipped $skipped non-existent path(s)" ([System.Drawing.Color]::Orange)
            }
        } catch {
            [System.Windows.Forms.MessageBox]::Show("Failed to read or parse file:`n$_", "Import Error", "OK", "Error")
        }
    }
}

function Stop-Server {
    $stopPending = $true

    if ($null -ne $logTimer) {
        try { $logTimer.Stop(); $logTimer.Dispose() } catch {}
        $logTimer = $null
    }

    if ($null -ne $proc) {
        try {
            if (-not $proc.HasExited) {
                $proc.Kill()
                $proc.WaitForExit(2000) | Out-Null
            }
        } catch {}
        try { $proc.Dispose() } catch {}
        $proc = $null
    }

    try { if ($logOutFile -and (Test-Path $logOutFile)) { Remove-Item $logOutFile -Force -ErrorAction SilentlyContinue } } catch {}
    try { if ($logErrFile -and (Test-Path $logErrFile)) { Remove-Item $logErrFile -Force -ErrorAction SilentlyContinue } } catch {}
    $logOutFile = $null
    $logErrFile = $null
    $logOutPos  = 0
    $logErrPos  = 0

    if (-not $logBox.IsDisposed) {
        Append-Log "[STOPPED] Server stopped" ([System.Drawing.Color]::Orange)
    }
    Set-Stopped
    $stopPending = $false
}

function Start-Server {
    if (-not (Test-Path $serverJs)) {
        [System.Windows.Forms.MessageBox]::Show("server.js not found at:`n$serverJs", "Error", "OK", "Error")
        return
    }
    $nodeExe = (Get-Command node -ErrorAction SilentlyContinue).Source
    if (-not $nodeExe) {
        [System.Windows.Forms.MessageBox]::Show("Node.js is not found in PATH. Please install Node.js.", "Error", "OK", "Error")
        return
    }

    $paths = @($listBox.Items)
    $port  = $portInput.Value

    Append-Log ("-" * 50) ([System.Drawing.Color]::DimGray)
    Append-Log "[START] Launching on port $port ..." ([System.Drawing.Color]::Cyan)
    Append-Log "        Node  : $nodeExe" ([System.Drawing.Color]::Gray)
    Append-Log "        Port  : $port" ([System.Drawing.Color]::Gray)
    if ($paths.Count -gt 0) {
        Append-Log "        Paths : $($paths.Count) directorie(s)" ([System.Drawing.Color]::Gray)
        foreach ($p in $paths) { Append-Log "          $p" ([System.Drawing.Color]::Gray) }
    } else {
        Append-Log "        Paths : (project directory only)" ([System.Drawing.Color]::Gray)
    }

    # Temp files for stdout/stderr capture (OS-level redirection, no .NET event handlers)
    $logOutFile = Join-Path $env:TEMP "vws_out_$pid.txt"
    $logErrFile = Join-Path $env:TEMP "vws_err_$pid.txt"
    $logOutPos  = 0
    $logErrPos  = 0

    # Preserve and set env vars for the server process
    $oldPort  = $env:PORT
    $oldPaths = $env:VIDEO_PATHS
    $env:PORT = [string]$port
    if ($paths.Count -gt 0) {
        $env:VIDEO_PATHS = [string]::Join(";", $paths)
    } else {
        Remove-Item env:VIDEO_PATHS -ErrorAction SilentlyContinue
    }

    try {
        $proc = Start-Process -FilePath $nodeExe `
            -ArgumentList "`"$serverJs`"" `
            -WorkingDirectory $scriptDir `
            -PassThru -NoNewWindow `
            -RedirectStandardOutput $logOutFile `
            -RedirectStandardError $logErrFile
    } catch {
        Append-Log "[ERROR] Failed to start process: $_" ([System.Drawing.Color]::Red)
        $proc = $null
        RestoreEnv
        return
    } finally {
        RestoreEnv
    }

    Set-Running
    Append-Log "[OK] Process started (PID $($proc.Id))" ([System.Drawing.Color]::Green)

    # Timer: poll temp files for new output + check if process died
    $logTimer = New-Object System.Windows.Forms.Timer
    $logTimer.Interval = 500
    $logTimer.Add_Tick({
        if ($logBox.IsDisposed) { return }

        # Check for unexpected process exit
        if ($null -ne $proc) {
            if ($proc.HasExited -and -not $stopPending) {
                try { $logTimer.Stop(); $logTimer.Dispose() } catch {}
                $logTimer = $null
                FlushLogFiles
                $exitCode = $proc.ExitCode
                try { $proc.Dispose() } catch {}
                $proc = $null
                Append-Log "[EXIT] Process exited (code $exitCode)" ([System.Drawing.Color]::Red)
                Set-Stopped
                return
            }
        }

        # Read new lines from stdout temp file
        if ($logOutFile -and (Test-Path $logOutFile)) {
            $fs = $null; $sr = $null
            try {
                $fs = [System.IO.File]::Open($logOutFile, "Open", "Read", "ReadWrite")
                if ($fs.Length -gt $logOutPos) {
                    $fs.Seek($logOutPos, "Begin") | Out-Null
                    $sr = New-Object System.IO.StreamReader($fs, [System.Text.Encoding]::UTF8)
                    $newText = $sr.ReadToEnd()
                    $logOutPos = $fs.Position
                    if ($newText) {
                        foreach ($line in ($newText -split "`r`n|`n|`r")) {
                            if ($line) { Append-Log $line }
                        }
                    }
                }
            } catch {}
            finally {
                if ($sr) { try { $sr.Dispose() } catch {} }
                if ($fs) { try { $fs.Close(); $fs.Dispose() } catch {} }
            }
        }

        # Read new lines from stderr temp file
        if ($logErrFile -and (Test-Path $logErrFile)) {
            $fs = $null; $sr = $null
            try {
                $fs = [System.IO.File]::Open($logErrFile, "Open", "Read", "ReadWrite")
                if ($fs.Length -gt $logErrPos) {
                    $fs.Seek($logErrPos, "Begin") | Out-Null
                    $sr = New-Object System.IO.StreamReader($fs, [System.Text.Encoding]::UTF8)
                    $newText = $sr.ReadToEnd()
                    $logErrPos = $fs.Position
                    if ($newText) {
                        foreach ($line in ($newText -split "`r`n|`n|`r")) {
                            if ($line) { Append-Log $line ([System.Drawing.Color]::OrangeRed) }
                        }
                    }
                }
            } catch {}
            finally {
                if ($sr) { try { $sr.Dispose() } catch {} }
                if ($fs) { try { $fs.Close(); $fs.Dispose() } catch {} }
            }
        }
    })
    $logTimer.Start()

    if ($autoOpenChk.Checked) {
        Start-Sleep -Milliseconds 900
        Start-Process "http://localhost:$port"
    }
}

function RestoreEnv {
    if ($null -ne $oldPort)  { $env:PORT = $oldPort }  else { Remove-Item env:PORT -ErrorAction SilentlyContinue }
    if ($null -ne $oldPaths) { $env:VIDEO_PATHS = $oldPaths } else { Remove-Item env:VIDEO_PATHS -ErrorAction SilentlyContinue }
}

function FlushLogFiles {
    if ($logOutFile -and (Test-Path $logOutFile)) {
        $newText = Get-Content $logOutFile -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
        if ($newText) {
            foreach ($line in ($newText -split "`r`n|`n|`r")) {
                if ($line) { Append-Log $line }
            }
        }
        Remove-Item $logOutFile -Force -ErrorAction SilentlyContinue
    }
    if ($logErrFile -and (Test-Path $logErrFile)) {
        $newText = Get-Content $logErrFile -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
        if ($newText) {
            foreach ($line in ($newText -split "`r`n|`n|`r")) {
                if ($line) { Append-Log $line ([System.Drawing.Color]::OrangeRed) }
            }
        }
        Remove-Item $logErrFile -Force -ErrorAction SilentlyContinue
    }
}

# ─── Init ───
Update-VideoCount

# ─── Run ───
[System.Windows.Forms.Application]::Run($form)

# Cleanup on exit (safety net)
if (-not $formClosed) {
    Stop-Server
    Save-Config $cfg
}
