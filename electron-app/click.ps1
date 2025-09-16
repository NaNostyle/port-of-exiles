param(
    [int]$x,
    [int]$y
)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Mouse {
    [DllImport("user32.dll")]
    public static extern void SetCursorPos(int x, int y);
    
    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, UIntPtr dwExtraInfo);
}
"@

# Move cursor to position
[Mouse]::SetCursorPos($x, $y)

# Left mouse button down
[Mouse]::mouse_event(0x0002, 0, 0, 0, [System.UIntPtr]::Zero)

# Left mouse button up
[Mouse]::mouse_event(0x0004, 0, 0, 0, [System.UIntPtr]::Zero)
