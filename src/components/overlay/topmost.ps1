Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class WinAPI {
  [DllImport("user32.dll")]
  public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
}
'@
$procs = Get-Process -Name chrome,chromium,msedge -ErrorAction SilentlyContinue
foreach ($p in $procs) {
  if ($p.MainWindowTitle -like '*Auto-Apply Overlay*') {
    [WinAPI]::SetWindowPos($p.MainWindowHandle, [IntPtr]::new(-1), 0, 0, 0, 0, 3)
  }
}
