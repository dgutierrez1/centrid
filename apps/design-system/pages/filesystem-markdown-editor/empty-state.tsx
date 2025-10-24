import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { EmptyStateNoDocuments } from '../../components/FilesystemMarkdownEditor';
import { FILESYSTEM_SCREENS } from '../../components/filesystem-screens';

export default function EmptyStatePage() {
  return (
    <DesignSystemFrame
      featureName="File System & Markdown Editor"
      featureId="003-filesystem-markdown-editor"
      screens={FILESYSTEM_SCREENS}
    >
      <EmptyStateNoDocuments />
    </DesignSystemFrame>
  );
}
