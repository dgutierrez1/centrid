import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { SearchResultsView } from '../../components/FilesystemMarkdownEditor';
import { FILESYSTEM_SCREENS } from '../../components/filesystem-screens';

export default function SearchResultsPage() {
  return (
    <DesignSystemFrame
      featureName="File System & Markdown Editor"
      featureId="003-filesystem-markdown-editor"
      screens={FILESYSTEM_SCREENS}
    >
      <SearchResultsView />
    </DesignSystemFrame>
  );
}
