import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { FileTreeContextMenu } from '../../components/FilesystemMarkdownEditor';
import { FILESYSTEM_SCREENS } from '../../components/filesystem-screens';

export default function ContextMenuPage() {
  return (
    <DesignSystemFrame
      featureName="File System & Markdown Editor"
      featureId="003-filesystem-markdown-editor"
      screens={FILESYSTEM_SCREENS}
    >
      <FileTreeContextMenu />
    </DesignSystemFrame>
  );
}
