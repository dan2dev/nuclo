// iOS app shell for the GPUI host: starts GPUI and drives its frames.
// Adapted from gpui-mobile's example/ios/main.m (Apache-2.0).
#import <QuartzCore/QuartzCore.h>
#import <UIKit/UIKit.h>

// nuclo-gpui (lib.rs)
void nuclo_ios_register(const char *bundle);
// gpui-mobile (src/ios/ffi.rs)
void gpui_ios_run_demo(void);
void *gpui_ios_get_window(void);
bool gpui_ios_request_frame(void *window);
void gpui_ios_set_frame_waker(void *window, void (*waker)(void *context), void *context);
void gpui_ios_will_enter_foreground(void *app);
void gpui_ios_did_become_active(void *app);
void gpui_ios_will_resign_active(void *app);
void gpui_ios_did_enter_background(void *app);
void gpui_ios_will_terminate(void *app);

@interface NucloAppDelegate : UIResponder <UIApplicationDelegate>
@property(nonatomic, strong) UIWindow *window;
@property(nonatomic, assign) void *gpuiWindow;
@property(nonatomic, strong) CADisplayLink *displayLink;
@end

static void NucloResumeFrames(void *context) {
    ((__bridge NucloAppDelegate *)context).displayLink.paused = NO;
}

@implementation NucloAppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)options {
    NSString *bundle = [NSBundle.mainBundle pathForResource:@"app" ofType:@"js"];
    nuclo_ios_register(bundle.UTF8String);
    gpui_ios_run_demo();
    self.gpuiWindow = gpui_ios_get_window();
    [self startFrames];
    return YES;
}

// GPUI says after each frame whether it wants another; the link pauses in between.
- (void)startFrames {
    if (!self.gpuiWindow || self.displayLink) return;
    self.displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(renderFrame)];
    [self.displayLink addToRunLoop:NSRunLoop.mainRunLoop forMode:NSRunLoopCommonModes];
    gpui_ios_set_frame_waker(self.gpuiWindow, NucloResumeFrames, (__bridge void *)self);
}

- (void)renderFrame {
    if (self.gpuiWindow && !gpui_ios_request_frame(self.gpuiWindow)) self.displayLink.paused = YES;
}

- (void)applicationWillEnterForeground:(UIApplication *)application {
    gpui_ios_will_enter_foreground(NULL);
    [self startFrames];
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
    gpui_ios_did_become_active(NULL);
}

- (void)applicationWillResignActive:(UIApplication *)application {
    gpui_ios_will_resign_active(NULL);
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
    gpui_ios_did_enter_background(NULL);
    [self.displayLink invalidate];
    self.displayLink = nil;
}

- (void)applicationWillTerminate:(UIApplication *)application {
    [self.displayLink invalidate];
    gpui_ios_will_terminate(NULL);
}

@end

int main(int argc, char *argv[]) {
    @autoreleasepool {
        return UIApplicationMain(argc, argv, nil, NSStringFromClass(NucloAppDelegate.class));
    }
}
