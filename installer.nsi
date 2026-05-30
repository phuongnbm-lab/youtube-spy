; YouTube Spy — NSIS Modern UI Installer
!define APP_NAME      "YouTube Spy"
!define APP_VERSION   "2026.05.43"
!define APP_EXE       "YouTube Spy.exe"
!define INSTALL_DIR   "$APPDATA\YouTube Spy"
!define PUBLISHER     "Bá Phương"

!include "MUI2.nsh"

; ── Cấu hình chung ────────────────────────────────────────────────────────────
Name "${APP_NAME} ${APP_VERSION}"
OutFile "dist\YouTube Spy Setup ${APP_VERSION}.exe"
InstallDir "${INSTALL_DIR}"
RequestExecutionLevel user
SetCompressor /SOLID lzma

; ── Giao diện MUI2 ────────────────────────────────────────────────────────────
!define MUI_ICON "Logo_build.ico"
!define MUI_UNICON "Logo_build.ico"
!define MUI_BGCOLOR "0F0F1A"
!define MUI_TEXTCOLOR "FFFFFF"

; Header
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_RIGHT

; Finish page: tự close & mở app
!define MUI_FINISHPAGE_NOAUTOCLOSE
!define MUI_FINISHPAGE_RUN "$INSTDIR\${APP_EXE}"
!define MUI_FINISHPAGE_RUN_TEXT "Mở YouTube Spy ngay"

; Auto-close sau khi cài xong
!define MUI_PAGE_CUSTOMFUNCTION_LEAVE InstallLeave
Function InstallLeave
  SetAutoClose true
FunctionEnd

; ── Pages ─────────────────────────────────────────────────────────────────────
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Vietnamese"

; ── Install ───────────────────────────────────────────────────────────────────
Section "Install"
  SetOutPath "$INSTDIR"
  File /r "dist\onedir\YouTube Spy\*.*"

  ; Shortcut Desktop & Start Menu
  CreateShortcut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}" "" "$INSTDIR\${APP_EXE}"
  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\Gỡ cài đặt.lnk" "$INSTDIR\Uninstall.exe"

  WriteUninstaller "$INSTDIR\Uninstall.exe"

  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayName" "${APP_NAME}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "Publisher" "${PUBLISHER}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayIcon" "$INSTDIR\${APP_EXE}"
SectionEnd

; ── Uninstall ─────────────────────────────────────────────────────────────────
Section "Uninstall"
  RMDir /r "$INSTDIR"
  Delete "$DESKTOP\${APP_NAME}.lnk"
  RMDir /r "$SMPROGRAMS\${APP_NAME}"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
SectionEnd
