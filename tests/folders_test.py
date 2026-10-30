import importlib.util
from pathlib import Path
import tempfile
import unittest
import sys

sys.dont_write_bytecode = True

spec = importlib.util.spec_from_file_location('folders', Path(__file__).parents[1] / 'mods/space-picker/folders.py')
folders = importlib.util.module_from_spec(spec)
spec.loader.exec_module(folders)


class FoldersTest(unittest.TestCase):
    def test_lists_directory_links_hidden_folders_and_special_names(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for name in ['project with spaces', "quote'$(echo nope)", '.config']:
                (root / name).mkdir()
            (root / 'link').symlink_to(root / 'project with spaces', target_is_directory=True)
            (root / 'broken').symlink_to(root / 'absent')
            (root / 'file').write_text('text')
            self.assertEqual(set(folders.directories(temp)), {
                str(root / name) for name in ['project with spaces', "quote'$(echo nope)", '.config', 'link']
            })

    def test_non_directory_and_missing_paths_fail(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'file'
            path.touch()
            with self.assertRaises(OSError):
                folders.directories(str(path))
            with self.assertRaises(OSError):
                folders.directories(str(path) + '-missing')

    def test_parent_of_symlink_uses_physical_parent(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'target/nested').mkdir(parents=True)
            (root / 'link').symlink_to(root / 'target/nested', target_is_directory=True)
            self.assertIn(str(root / 'link/../nested'), folders.directories(str(root / 'link/..')))
