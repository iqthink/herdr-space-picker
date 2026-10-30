"""List local folders, following directory symlinks; never invoke a shell."""
import json
import os
import sys
import signal


def timeout(_signal, _frame):
    raise TimeoutError('Folder scan timed out')


def directories(path):
    with os.scandir(path) as entries:
        result = []
        for entry in entries:
            try:
                if entry.is_dir(follow_symlinks=True):
                    result.append(os.path.join(path, entry.name))
            except OSError:
                continue  # A disappeared entry or broken link must not hide its siblings.
        return sorted(result)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit('Usage: folders.py DIRECTORY [check]')
    try:
        signal.signal(signal.SIGALRM, timeout)
        signal.alarm(5)
        path = sys.argv[1]
        if len(sys.argv) > 2 and sys.argv[2] == 'check':
            with os.scandir(path):
                pass
            print(json.dumps(os.path.realpath(path)))
        else:
            print(json.dumps(directories(path)))
    except OSError:
        sys.exit(1)
