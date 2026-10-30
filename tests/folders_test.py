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


    def test_deep_index_follows_links_without_cycles_and_skips_dependencies(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'storage/company/clients/project-name').mkdir(parents=True)
            (root / 'hq').symlink_to(root / 'storage', target_is_directory=True)
            (root / 'storage/loop').symlink_to(root / 'storage', target_is_directory=True)
            for name in ['node_modules', '.hidden', 'vendor']:
                (root / 'storage' / name / 'buried').mkdir(parents=True)
            result = folders.build_index([str(root / 'hq')])
            self.assertIn(str(root / 'hq/company/clients/project-name'), result['paths'])
            self.assertFalse(result['limited'])
            self.assertFalse(any('/buried' in path or '/loop/loop' in path for path in result['paths']))

    def test_archive_subtrees_do_not_consume_budget_before_active_folders(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for i in range(20):
                (root / 'archive' / str(i)).mkdir(parents=True)
            target = root / 'company/clients/project'
            target.mkdir(parents=True)
            result = folders.build_index([temp], max_entries=8)
            self.assertIn(str(target), result['paths'])
            self.assertTrue(result['limited'])
            self.assertLessEqual(len(result['paths']), 8)
            self.assertTrue(folders.build_index([temp], max_seconds=0)['limited'])

    def test_cached_index_can_be_explicitly_refreshed(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / 'projects'
            root.mkdir()
            cache = str(Path(temp) / 'data/index.json')
            roots = [str(root)]
            folders.folder_index(roots, cache)
            added = root / 'new-project'
            added.mkdir()
            self.assertNotIn(str(added), folders.folder_index(roots, cache)['paths'])
            self.assertIn(str(added), folders.folder_index(roots, cache, ttl=0)['paths'])
