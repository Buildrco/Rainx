from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = REPO_ROOT / "artifacts" / "rainx"
ANDROID = PROJECT_ROOT / "android"
PLUGIN_SOURCE = REPO_ROOT / "scripts" / "native" / "android" / "RainxBottomSheetPlugin.java"
PLUGIN_TARGET = ANDROID / "app/src/main/java/com/rainx/app/RainxBottomSheetPlugin.java"

if not ANDROID.exists():
    raise SystemExit("Capacitor Android project is missing")

PLUGIN_TARGET.parent.mkdir(parents=True, exist_ok=True)
plugin_text = PLUGIN_SOURCE.read_text(encoding="utf-8")
plugin_text = plugin_text.replace(
    "FrameLayout.LayoutParams.MATCH_PARENT,\n                FrameLayout.LayoutParams.MATCH_PARENT",
    "FrameLayout.LayoutParams.MATCH_PARENT,\n                (int) (screenHeight * 0.94f)"
).replace(
    "loadHtml(html, baseUrl);\n            expandSheet();\n            call.resolve();",
    "updateSheet(html, baseUrl);\n            call.resolve();"
).replace(
    "behavior.setFitToContents(true);\n        behavior.setPeekHeight(BottomSheetBehavior.PEEK_HEIGHT_AUTO);\n        behavior.setState(BottomSheetBehavior.STATE_EXPANDED);",
    "behavior.setFitToContents(true);\n        behavior.setPeekHeight(0);\n        behavior.setState(BottomSheetBehavior.STATE_EXPANDED);\n        android.view.ViewGroup.LayoutParams sheetParams = bottomSheet.getLayoutParams();\n        sheetParams.height = (int) (getContext().getResources().getDisplayMetrics().heightPixels * 0.94f);\n        bottomSheet.setLayoutParams(sheetParams);"
)
PLUGIN_TARGET.write_text(plugin_text, encoding="utf-8")

app_gradle = ANDROID / "app/build.gradle"
if not app_gradle.exists():
    raise SystemExit("Capacitor Android app/build.gradle is missing")
gradle_text = app_gradle.read_text(encoding="utf-8")
material_dependency = "implementation 'com.google.android.material:material:1.12.0'"
if material_dependency not in gradle_text:
    if "dependencies {" not in gradle_text:
        raise SystemExit("Capacitor app/build.gradle has no dependencies block")
    gradle_text = gradle_text.replace("dependencies {", "dependencies {\n    " + material_dependency, 1)
    app_gradle.write_text(gradle_text, encoding="utf-8")

activities = list((ANDROID / "app/src/main/java").rglob("MainActivity.java"))
if not activities:
    raise SystemExit("Capacitor MainActivity.java was not generated")

activity = activities[0]
activity_text = activity.read_text(encoding="utf-8")
if "RainxBottomSheetPlugin" not in activity_text:
    if "import com.getcapacitor.BridgeActivity;" not in activity_text:
        raise SystemExit("Capacitor MainActivity.java has an unexpected import layout")
    activity_text = activity_text.replace(
        "import com.getcapacitor.BridgeActivity;",
        "import android.os.Bundle;\nimport com.getcapacitor.BridgeActivity;\nimport com.rainx.app.RainxBottomSheetPlugin;",
        1,
    )
    activity_text = activity_text.replace(
        "public class MainActivity extends BridgeActivity {",
        "public class MainActivity extends BridgeActivity {\n    @Override\n    public void onCreate(Bundle savedInstanceState) {\n        super.onCreate(savedInstanceState);\n        registerPlugin(RainxBottomSheetPlugin.class);\n    }",
        1,
    )
    activity.write_text(activity_text, encoding="utf-8")

print("Native RainX bottom-sheet plugin installed")
