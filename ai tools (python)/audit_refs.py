import subprocess, textwrap
files=[
 'NodePersonalitySystem2_0.js',
 'NodePersonality2_0.js',
 'NodePersonality2_0_EnhancedLayer.js',
 'NodeVisuals4_0.js',
 'NodeVisualBootstrap3_0.js',
 'NodePersonalitySystem.js'
]
for f in files:
    print(f"\n-- {f}")
    p=subprocess.run(['rg','--files-with-matches',f],capture_output=True,text=True)
    lines=p.stdout.splitlines()
    print('files_with_match',len(lines))
    for l in lines:
        print(' ',l)
    p2=subprocess.run(['rg','--no-heading','--line-number',f],capture_output=True,text=True)
    lines2=p2.stdout.splitlines()
    print('occurrences',len(lines2))
    for l in lines2[:12]:
        print(' ',l)
