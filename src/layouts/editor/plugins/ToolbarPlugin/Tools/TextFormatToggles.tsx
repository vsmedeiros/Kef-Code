"use client"
import * as React from 'react';
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, LexicalEditor, COMMAND_PRIORITY_CRITICAL, SELECTION_CHANGE_COMMAND, TextFormatType, $isNodeSelection, } from "lexical";
import { $patchStyleText, } from '@lexical/selection';
import { FormatBold, FormatItalic, FormatUnderlined, Code, FormatStrikethrough, Subscript, Superscript, Link } from '@mui/icons-material';
import { mergeRegister, } from '@lexical/utils';
import { $isLinkNode } from '@lexical/link';
import { getSelectedNode } from '@/layouts/editor/utils/getSelectedNode';
import { IS_APPLE } from '../../../shared/environment';
import { useCallback, useEffect, useState } from 'react';
import { SxProps, Theme } from '@mui/material/styles';
import ColorPicker from './ColorPicker';
import { $isMathNode, MathNode } from '../../../nodes/MathNode';
import { $patchStyle } from '../../../nodes/utils';
import { SET_DIALOGS_COMMAND } from '../../ToolbarPlugin'

export default function TextFormatToggles({ editor, sx }: { editor: LexicalEditor, sx?: SxProps<Theme> | undefined }): JSX.Element {
  const [isLink, setIsLink] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isCode, setIsCode] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {

      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsSubscript(selection.hasFormat('subscript'));
      setIsSuperscript(selection.hasFormat('superscript'));
      setIsCode(selection.hasFormat('code'));

      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }

    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
    );
  }, [editor, updateToolbar]);

  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, styles);
          const mathNodes = selection.getNodes().filter(node => $isMathNode(node)) as MathNode[];
          $patchStyle(mathNodes, styles);
        }
      });
    },
    [editor],
  );

  const onColorChange = useCallback((key: string, value: string) => {
    const styleKey = key === 'text' ? 'color' : 'background-color';
    applyStyleText({ [styleKey]: value });
  }, [applyStyleText]);

  const handleFormat = (event: React.MouseEvent<HTMLElement>, newFormats: string[]) => {
    const button = event.currentTarget as HTMLButtonElement;
    if (!button) return;
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, button.value as TextFormatType);
  };

  const formatObj = { isBold, isItalic, isUnderline, isStrikethrough, isSubscript, isSuperscript, isCode, isLink };
  const formatKeys = Object.keys(formatObj) as Array<keyof typeof formatObj>;

  const formats = formatKeys.reduce(
    (accumelator, currentKey) => {
      if (formatObj[currentKey]) {
        accumelator.push(currentKey.toLowerCase().split('is')[1]);
      }
      return accumelator;
    }, [] as string[],
  );

  const openLinkDialog = () => editor.dispatchCommand(SET_DIALOGS_COMMAND, ({ link: { open: true } }));

  return (<ToggleButtonGroup size="small" sx={{ ...sx }} value={formats} onChange={handleFormat} aria-label="text formatting">
    <ToggleButton value="bold" title={IS_APPLE ? 'מודגש (⌘B)' : 'מודגש (Ctrl+B)'} aria-label={`מודגש ${IS_APPLE ? '⌘B' : 'Ctrl+B'}`}>
      <FormatBold />
    </ToggleButton>
    <ToggleButton value="italic" title={IS_APPLE ? 'הטה (⌘I)' : 'הטה (Ctrl+I)'} aria-label={`הטה ${IS_APPLE ? '⌘I' : 'Ctrl+I'}`}>
      <FormatItalic />
    </ToggleButton>
    <ToggleButton value="underline" title={IS_APPLE ? 'קו תחתון (⌘U)' : 'קו תחתון (Ctrl+U)'} aria-label={`קו תחתון ${IS_APPLE ? '⌘U' : 'Ctrl+U'}`}>
      <FormatUnderlined />
    </ToggleButton>
    <ToggleButton value="code" title='קוד' aria-label='קוד'>
      <Code />
    </ToggleButton>
    <ToggleButton value="strikethrough" title='כתב חוצה' aria-label='כתב חוצה'>
      <FormatStrikethrough />
    </ToggleButton>
    <ToggleButton value="subscript" title='כתב תחתי' aria-label='כתב תחתי'>
      <Subscript />
    </ToggleButton>
    <ToggleButton value="superscript" title='כתב עילי' aria-label='כתב עילי'>
      <Superscript />
    </ToggleButton>
    <ToggleButton value="link" title='הוספת קישור' aria-label='הוספת קישור' onClick={openLinkDialog}>
      <Link />
    </ToggleButton>
    <div title="צבע">
    <ColorPicker onColorChange={onColorChange} />
    </div>
  </ToggleButtonGroup>)
}