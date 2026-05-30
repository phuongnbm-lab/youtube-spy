; YouTube Spy — NSIS Installer Script
; Cài vào %APPDATA%\YouTube Spy\ (không cần UAC)

!define APP_NAME      "YouTube Spy"
!define APP_VERSION   "2026.05.42"
!define APP_EXE       "YouTube Spy.exe"
!define INSTALL_DIR   "$APPDATA\YouTube Spy"
!define PUBLISHER     "Bá Phương"

Name "${APP_NAME} ${APP_VERSION}"
OutFile "dist\YouTube Spy Setup 2026.05.42.exe"
InstallDir "${INSTALL_DIR}"
RequestExecutionLevel user   ; Không cần UAC
ShowInstDetails nevershow
ShowUninstDetails nevershow
; SilentInstall chỉ khi gọi với /S (auto-update), không set mặc định

; Icon
Icon "Logo_build.ico"
UninstallIcon "Logo_build.ico"

;---------------------------------------------------
Section "Install"
  SetOutPath "$INSTDIR"

  ; Copy toàn bộ file từ thư mục onedir build
  File /r "dist\onedir\YouTube Spy\*.*"

  ; Shortcut Desktop
  CreateShortcut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}" "" "$INSTDIR\${APP_EXE}"

  ; Shortcut Start Menu
  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}" "" "$INSTDIR\${APP_EXE}"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\Gỡ cài đặt.lnk" "$INSTDIR\Uninstall.exe"

  ; Ghi uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; Registry để hiện trong Add/Remove Programs
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayName" "${APP_NAME}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "Publisher" "${PUBLISHER}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayIcon" "$INSTDIR\${APP_EXE}"

  ; Tự mở app sau khi cài
  Exec '"$INSTDIR\${APP_EXE}"'
SectionEnd

;---------------------------------------------------
Section "Uninstall"
  RMDir /r "$INSTDIR"
  Delete "$DESKTOP\${APP_NAME}.lnk"
  RMDir /r "$SMPROGRAMS\${APP_NAME}"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
SectionEnd
