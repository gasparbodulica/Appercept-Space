'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, useCurrentAccount } from '@/lib/store';
import { useIsMobile } from '@/lib/useIsMobile';
import { Topbar } from '@/components/layout/Topbar';
import { Channel, User, ChatMessage } from '@/lib/types';
import { PageIcon, PAGE_COLORS } from '@/lib/icons';
import {
  IconSend, IconPlus, IconHash, IconUserPlus, IconPencil,
  IconX, IconTrash, IconMessage, IconPaperclip, IconPhoto, IconLink,
  IconFile, IconDownload, IconChevronRight, IconArrowLeft, IconExternalLink, IconLock,
  IconUsersGroup, IconMessagePlus,
} from '@tabler/icons-react';

const hdrBtn: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
  border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-elevated)',
  color: 'var(--color-text-secondary)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

// Curated channel icons for the picker
const CHANNEL_ICONS = [
  'IconMessage', 'IconMessages', 'IconPalette', 'IconCode', 'IconUsers',
  'IconBriefcase', 'IconRocket', 'IconBolt', 'IconFlame', 'IconChartBar',
  'IconMusic', 'IconSparkles', 'IconTarget', 'IconBell', 'IconHeart', 'IconStar',
];

// Map any legacy emoji values to an icon name; pass through icon names.
const EMOJI_TO_ICON: Record<string, string> = {
  '💬': 'IconMessage', '🎨': 'IconPalette', '💻': 'IconCode', '🤝': 'IconBriefcase',
  '🚀': 'IconRocket', '📣': 'IconBell', '🧠': 'IconBolt', '🎵': 'IconMusic',
  '📊': 'IconChartBar', '🔥': 'IconFlame',
};
function channelIconName(value?: string): string {
  if (!value) return 'IconMessage';
  if (value.startsWith('Icon')) return value;
  return EMOJI_TO_ICON[value] ?? 'IconMessage';
}

const MENTION_ALL = new Set(['everyone', 'channel', 'all']);

// Render message text, highlighting @everyone and @member mentions.
function renderBody(text: string, channel: Channel | undefined, users: User[], currentUserId: string): React.ReactNode {
  const memberFirst = (channel?.member_ids ?? []).map((id) => {
    const u = users.find((x) => x.id === id);
    return { id, first: (u?.name.split(/\s+/)[0] ?? '').toLowerCase() };
  });
  const myFirst = (users.find((u) => u.id === currentUserId)?.name.split(/\s+/)[0] ?? '').toLowerCase();

  const re = /@([A-Za-zÀ-ž]+)/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    const token = m[1].toLowerCase();
    const isEveryone = MENTION_ALL.has(token);
    const member = memberFirst.find((mm) => mm.first === token);
    if (!isEveryone && !member) continue;
    if (m.index > last) out.push(text.slice(last, m.index));
    const mentionsMe = isEveryone || token === myFirst || (member && member.id === currentUserId);
    out.push(
      <span key={`mn-${i++}`} style={{
        padding: '1px 5px', borderRadius: 5, fontWeight: 700,
        background: mentionsMe ? 'rgba(245,197,24,0.22)' : 'var(--color-accent-subtle)',
        color: mentionsMe ? '#f5c518' : 'var(--color-accent-bright)',
      }}>@{m[1]}</span>
    );
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length ? out : text;
}

export default function MessagesPage() {
  const router = useRouter();
  const { channels, chatMessages, users, currentUserId, sendMessage, deleteChannel } = useAppStore();
  const isAdmin = useCurrentAccount()?.role === 'admin';

  const myChannels = useMemo(
    () => channels.filter((c) => c.member_ids.includes(currentUserId)),
    [channels, currentUserId]
  );
  const groups = myChannels.filter((c) => c.kind === 'channel');
  const dms = myChannels.filter((c) => c.kind === 'dm');

  const [activeId, setActiveId] = useState<string>(myChannels[0]?.id ?? '');
  const isMobile = useIsMobile();
  const [mobileShowThread, setMobileShowThread] = useState(false);
  // Selecting a conversation jumps to the thread pane on mobile.
  const selectChannel = (id: string) => { setActiveId(id); setMobileShowThread(true); };
  const [draft, setDraft] = useState('');
  const [newModal, setNewModal] = useState(false);
  const [newChat, setNewChat] = useState(false);
  const [plusMenu, setPlusMenu] = useState(false);
  const [memberPopover, setMemberPopover] = useState(false);
  const [editPopover, setEditPopover] = useState(false);
  const [linkPicker, setLinkPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const active = myChannels.find((c) => c.id === activeId) ?? myChannels[0];
  const messages = useMemo(
    () => chatMessages.filter((m) => m.channel_id === active?.id).sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [chatMessages, active?.id]
  );

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length, active?.id]);
  useEffect(() => { if (!myChannels.some((c) => c.id === activeId) && myChannels[0]) setActiveId(myChannels[0].id); }, [myChannels, activeId]);

  const userById = (id: string): User | undefined => users.find((u) => u.id === id);
  const otherMember = (c: Channel) => userById(c.member_ids.find((id) => id !== currentUserId) ?? '');

  const isGroupDM = (c: Channel) => c.kind === 'dm' && c.member_ids.length > 2;
  const others = (c: Channel) => c.member_ids.filter((id) => id !== currentUserId).map(userById).filter(Boolean) as User[];
  const dmTitle = (c: Channel) => {
    if (c.name) return c.name;
    const o = others(c);
    if (o.length <= 1) return o[0]?.name ?? 'Direct message';
    return o.map((u) => u.name.split(/\s+/)[0]).join(', ');
  };
  const channelName = (c: Channel) => (c.kind === 'dm' ? dmTitle(c) : c.name);
  const lastMsg = (c: Channel) => chatMessages.filter((m) => m.channel_id === c.id).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  // Avatar for a DM: 1:1 → the other person, group → a stacked/group tile
  const dmAvatar = (c: Channel, size = 32) => {
    const o = others(c);
    if (o.length <= 1) return <Avatar user={o[0]} size={size} />;
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--color-bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-bright)', position: 'relative' }}>
        <IconUsersGroup size={Math.round(size * 0.5)} />
      </div>
    );
  };

  const send = () => {
    if (!draft.trim() || !active) return;
    sendMessage(active.id, draft);
    setDraft('');
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, kind: 'image' | 'file') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !active) return;
    if (file.size > 4 * 1024 * 1024) { alert('File is too large — max 4 MB in this demo.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      sendMessage(active.id, draft.trim(), {
        attachment: { kind: kind === 'image' && file.type.startsWith('image/') ? 'image' : 'file', name: file.name, url: reader.result as string, size: file.size, mime: file.type },
      });
      setDraft('');
    };
    reader.readAsDataURL(file);
  };

  const sendDbRef = (ref: ChatMessage['dbref']) => {
    if (!active || !ref) return;
    sendMessage(active.id, draft.trim(), { dbref: ref });
    setDraft('');
    setLinkPicker(false);
  };

  // @-mention autocomplete
  const onDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setDraft(val);
    const cursor = e.target.selectionStart ?? val.length;
    const before = val.slice(0, cursor);
    const m = before.match(/(?:^|\s)@([^\s@]*)$/);
    if (m) { setMentionQuery(m[1]); setMentionStart(cursor - m[1].length - 1); }
    else setMentionQuery(null);
  };

  const mentionCandidates = useMemo(() => {
    if (mentionQuery === null || !active) return [];
    const q = mentionQuery.toLowerCase();
    const members = active.member_ids.map((id) => userById(id)).filter(Boolean) as User[];
    const list = [{ key: 'everyone', label: 'everyone', sub: 'Notify the whole channel', user: undefined as User | undefined }];
    members.forEach((u) => list.push({ key: u.id, label: u.name.split(/\s+/)[0], sub: u.name, user: u }));
    return list.filter((c) => c.label.toLowerCase().includes(q)).slice(0, 6);
  }, [mentionQuery, active, users]);

  const pickMention = (label: string) => {
    const head = draft.slice(0, mentionStart);
    const tail = draft.slice(mentionStart + 1 + (mentionQuery?.length ?? 0));
    const next = `${head}@${label} ${tail}`;
    setDraft(next);
    setMentionQuery(null);
    setTimeout(() => {
      const pos = head.length + label.length + 2;
      textRef.current?.focus();
      textRef.current?.setSelectionRange(pos, pos);
    }, 0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Topbar breadcrumb={['Messages']} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* ── Conversations list ── */}
        <div style={{
          width: isMobile ? '100%' : 280, minWidth: isMobile ? 0 : 280,
          borderRight: '0.5px solid var(--color-border-subtle)',
          display: isMobile && mobileShowThread ? 'none' : 'flex',
          flexDirection: 'column', background: 'var(--color-bg-surface)',
        }}>
          <div style={{ padding: '16px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Messages</h2>
            <button onClick={() => setPlusMenu((v) => !v)} title="New chat or channel"
              style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'var(--gradient-accent)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,210,255,0.25)' }}>
              <IconPlus size={16} />
            </button>
            {plusMenu && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setPlusMenu(false)} />
                <div style={{ position: 'absolute', top: 44, right: 16, zIndex: 50, width: 200, background: 'var(--color-bg-popover)', border: '0.5px solid var(--color-border-default)', borderRadius: 10, boxShadow: '0 16px 56px rgba(0,0,0,0.6)', overflow: 'hidden', padding: 4 }}>
                  <button onClick={() => { setNewChat(true); setPlusMenu(false); }} style={menuItem}>
                    <IconMessagePlus size={16} style={{ color: 'var(--color-accent-bright)' }} />
                    <div><div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 600 }}>New chat</div><div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Private DM or group chat</div></div>
                  </button>
                  <button onClick={() => { setNewModal(true); setPlusMenu(false); }} style={menuItem}>
                    <IconHash size={16} style={{ color: 'var(--color-accent-bright)' }} />
                    <div><div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 600 }}>New channel</div><div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>A team channel (admin)</div></div>
                  </button>
                </div>
              </>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
            <ListSection label="Channels" />
            {groups.map((c) => (
              <ConvItem key={c.id} active={c.id === active?.id} onClick={() => selectChannel(c.id)}
                avatar={<EmojiTile emoji={c.emoji} color={c.color} />}
                name={c.name} preview={lastMsg(c) ? `${userById(lastMsg(c)!.sender_id)?.name.split(' ')[0] ?? ''}: ${lastMsg(c)!.body}` : (c.description ?? 'No messages yet')} />
            ))}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 10px 4px' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Direct messages</span>
              <button onClick={() => setNewChat(true)} title="New chat" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-accent-bright)', display: 'flex', padding: 2 }}>
                <IconPlus size={14} />
              </button>
            </div>
            {dms.map((c) => (
              <ConvItem key={c.id} active={c.id === active?.id} onClick={() => selectChannel(c.id)}
                avatar={dmAvatar(c, 32)}
                name={dmTitle(c)} preview={lastMsg(c) ? `${userById(lastMsg(c)!.sender_id)?.name.split(' ')[0] ?? ''}: ${lastMsg(c)!.body ?? '📎 Attachment'}` : (isGroupDM(c) ? `${c.member_ids.length} people` : 'No messages yet')} />
            ))}
          </div>
        </div>

        {/* ── Active conversation ── */}
        {active ? (
          <div style={{
            flex: 1, display: isMobile && !mobileShowThread ? 'none' : 'flex',
            flexDirection: 'column', overflow: 'hidden', position: 'relative', minWidth: 0,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '0.5px solid var(--color-border-subtle)', flexShrink: 0 }}>
              {isMobile && (
                <button onClick={() => setMobileShowThread(false)} aria-label="Back to conversations"
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', padding: 2, marginRight: -4 }}>
                  <IconArrowLeft size={20} />
                </button>
              )}
              {active.kind === 'dm' ? dmAvatar(active, 34) : <EmojiTile emoji={active.emoji} color={active.color} size={34} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {active.kind === 'channel' && <IconHash size={15} style={{ color: active.color }} />}
                  {channelName(active)}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {active.kind === 'dm'
                    ? (isGroupDM(active) ? `${active.member_ids.length} people · group chat` : otherMember(active)?.email)
                    : `${active.member_ids.length} members${active.description ? ' · ' + active.description : ''}`}
                </div>
              </div>
              {/* Member avatars (always shown for channels) */}
              {active.kind === 'channel' && (
                <div style={{ display: 'flex', marginRight: 4 }}>
                  {active.member_ids.slice(0, 4).map((id, i) => (
                    <div key={id} style={{ marginLeft: i === 0 ? 0 : -8, border: '2px solid var(--color-bg-surface)', borderRadius: '50%' }}>
                      <Avatar user={userById(id)} size={26} />
                    </div>
                  ))}
                </div>
              )}

              {/* Channel management — ADMINS ONLY */}
              {active.kind === 'channel' && isAdmin && (
                <>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => { setEditPopover((v) => !v); setMemberPopover(false); }} title="Edit channel"
                      style={hdrBtn}>
                      <IconPencil size={15} />
                    </button>
                    {editPopover && <ChannelEditPopover channel={active} onClose={() => setEditPopover(false)} />}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => { setMemberPopover((v) => !v); setEditPopover(false); }} title="Manage members" style={hdrBtn}>
                      <IconUserPlus size={15} />
                    </button>
                    {memberPopover && <MembersPopover channel={active} onClose={() => setMemberPopover(false)} />}
                  </div>
                  <button onClick={() => { if (confirm(`Delete #${active.name}? This removes all its messages.`)) deleteChannel(active.id); }}
                    title="Delete channel"
                    style={{ ...hdrBtn, border: 'none', background: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-red)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
                    <IconTrash size={15} />
                  </button>
                </>
              )}

              {/* Non-admins: read-only members badge */}
              {active.kind === 'channel' && !isAdmin && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <IconLock size={11} /> Admin-managed
                </span>
              )}

              {/* DMs: any participant can add/remove people and delete the chat */}
              {active.kind === 'dm' && (
                <>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setMemberPopover((v) => !v)} title="Add or remove people" style={hdrBtn}>
                      <IconUserPlus size={15} />
                    </button>
                    {memberPopover && <MembersPopover channel={active} isDM onClose={() => setMemberPopover(false)} />}
                  </div>
                  <button onClick={() => { if (confirm('Delete this conversation?')) deleteChannel(active.id); }}
                    title="Delete conversation" style={{ ...hdrBtn, border: 'none', background: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-red)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
                    <IconTrash size={15} />
                  </button>
                </>
              )}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {messages.length === 0 && (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  <IconMessage size={30} style={{ opacity: 0.5, marginBottom: 8 }} />
                  <div style={{ fontSize: 'var(--text-sm)' }}>This is the start of your conversation.</div>
                </div>
              )}
              {messages.map((m, i) => {
                const u = userById(m.sender_id);
                const mine = m.sender_id === currentUserId;
                const prev = messages[i - 1];
                const grouped = prev && prev.sender_id === m.sender_id && (new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60 * 1000);
                return (
                  <div key={m.id} style={{ display: 'flex', gap: 10, padding: grouped ? '1px 0 1px 42px' : '8px 0 1px', alignItems: 'flex-start' }}>
                    {!grouped && <Avatar user={u} size={32} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {!grouped && (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: mine ? 'var(--color-accent-bright)' : 'var(--color-text-primary)' }}>{u?.name ?? 'Unknown'}{mine && ' (you)'}</span>
                          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{new Date(m.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                        </div>
                      )}
                      {m.body && (
                        <div style={{
                          display: 'inline-block', maxWidth: '88%',
                          fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', lineHeight: 1.5,
                          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                          padding: '8px 12px', borderRadius: mine ? '12px 12px 4px 12px' : '4px 12px 12px 12px',
                          background: mine ? 'rgba(28,117,188,0.18)' : 'var(--color-bg-elevated)',
                          border: `0.5px solid ${mine ? 'rgba(0,210,255,0.22)' : 'var(--color-border-default)'}`,
                        }}>
                          {renderBody(m.body, active, users, currentUserId)}
                        </div>
                      )}
                      {m.attachment && <AttachmentView att={m.attachment} />}
                      {m.dbref && <DbRefChip dbref={m.dbref} onOpen={() => {
                        router.push(`/pages/${m.dbref!.page_slug}`);
                        setTimeout(() => useAppStore.getState().openRow(m.dbref!.row_id, m.dbref!.database_id), 120);
                      }} />}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Composer */}
            <div style={{ padding: '12px 20px 18px', flexShrink: 0, position: 'relative' }}>
              {/* hidden inputs */}
              <input ref={imageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFile(e, 'image')} />
              <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={(e) => handleFile(e, 'file')} />
              {linkPicker && <DbLinkPicker onPick={sendDbRef} onClose={() => setLinkPicker(false)} />}

              {/* @-mention autocomplete */}
              {mentionQuery !== null && mentionCandidates.length > 0 && (
                <div style={{ position: 'absolute', bottom: '100%', left: 20, marginBottom: 8, width: 240, zIndex: 200, background: 'var(--color-bg-popover)', border: '0.5px solid var(--color-border-default)', borderRadius: 10, boxShadow: '0 16px 56px rgba(0,0,0,0.6)', overflow: 'hidden', padding: 4 }}>
                  <div style={{ padding: '6px 10px 4px', fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mention</div>
                  {mentionCandidates.map((c) => (
                    <button key={c.key} onClick={() => pickMention(c.label)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', borderRadius: 7, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                      {c.user
                        ? <Avatar user={c.user} size={26} />
                        : <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--gradient-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>@</div>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>@{c.label}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, background: 'var(--color-bg-input)', border: '0.5px solid var(--color-border-default)', borderRadius: 12, padding: '8px 8px 8px 8px' }}>
                {/* attach buttons */}
                <button onClick={() => imageRef.current?.click()} title="Send a photo" style={composerBtn}><IconPhoto size={18} /></button>
                <button onClick={() => fileRef.current?.click()} title="Send a file" style={composerBtn}><IconPaperclip size={18} /></button>
                <button onClick={() => setLinkPicker((v) => !v)} title="Link a database row" style={{ ...composerBtn, color: linkPicker ? 'var(--color-accent-bright)' : 'var(--color-text-muted)' }}><IconLink size={18} /></button>

                <textarea
                  ref={textRef}
                  value={draft}
                  onChange={onDraftChange}
                  onKeyDown={(e) => {
                    if (mentionQuery !== null && mentionCandidates.length > 0 && (e.key === 'Enter' || e.key === 'Tab')) { e.preventDefault(); pickMention(mentionCandidates[0].label); return; }
                    if (e.key === 'Escape' && mentionQuery !== null) { setMentionQuery(null); return; }
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
                  }}
                  placeholder={`Message ${active.kind === 'channel' ? '#' + active.name : channelName(active)}…  (type @ to mention)`}
                  rows={1}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)', lineHeight: 1.5, maxHeight: 120, padding: '5px 4px' }}
                />
                <button onClick={send} disabled={!draft.trim()}
                  style={{ width: 34, height: 34, borderRadius: 9, border: 'none', flexShrink: 0, cursor: draft.trim() ? 'pointer' : 'default', background: draft.trim() ? 'var(--gradient-accent)' : 'var(--color-bg-active)', color: draft.trim() ? '#fff' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconSend size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: isMobile ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            No conversations yet — create one with the + button.
          </div>
        )}
      </div>

      {newModal && <NewChannelModal onClose={() => setNewModal(false)} onCreated={(id) => { setActiveId(id); setNewModal(false); }} />}
      {newChat && <NewChatModal onClose={() => setNewChat(false)} onCreated={(id) => { setActiveId(id); setNewChat(false); }} />}
    </div>
  );
}

// ─── Pieces ───────────────────────────────────────────────────────────────────

function ListSection({ label }: { label: string }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 10px 4px' }}>{label}</div>;
}

function ConvItem({ active, onClick, avatar, name, preview }: { active: boolean; onClick: () => void; avatar: React.ReactNode; name: string; preview: string }) {
  return (
    <div onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: active ? 'var(--color-bg-active)' : 'transparent', transition: 'background 80ms' }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
      <div style={{ flexShrink: 0 }}>{avatar}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview}</div>
      </div>
    </div>
  );
}

function Avatar({ user, size = 32 }: { user?: User; size?: number }) {
  if (!user) return <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--color-bg-active)' }} />;
  return user.avatar_url
    ? <img src={user.avatar_url} alt={user.initials} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.36 }}>{user.initials}</div>;
}

function EmojiTile({ emoji, color, size = 32 }: { emoji?: string; color?: string; size?: number }) {
  const c = color ?? '#1c75bc';
  return (
    <div style={{ width: size, height: size, borderRadius: 9, background: `${c}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c }}>
      <PageIcon name={channelIconName(emoji)} size={Math.round(size * 0.56)} />
    </div>
  );
}

const composerBtn: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, flexShrink: 0, border: 'none', background: 'none',
  color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};

function fmtSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function AttachmentView({ att }: { att: import('@/lib/types').ChatAttachment }) {
  if (att.kind === 'image') {
    return (
      <a href={att.url} download={att.name} style={{ display: 'inline-block', marginTop: 6 }}>
        <img src={att.url} alt={att.name} style={{ maxWidth: 320, maxHeight: 240, borderRadius: 10, border: '0.5px solid var(--color-border-default)', display: 'block' }} />
      </a>
    );
  }
  return (
    <a href={att.url} download={att.name}
      style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--color-bg-elevated)', border: '0.5px solid var(--color-border-default)', textDecoration: 'none', maxWidth: 320 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-accent-subtle)', color: 'var(--color-accent-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconFile size={17} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</div>
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{fmtSize(att.size)}</div>
      </div>
      <IconDownload size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
    </a>
  );
}

function DbRefChip({ dbref, onOpen }: { dbref: import('@/lib/types').ChatDbRef; onOpen: () => void }) {
  return (
    <div onClick={onOpen}
      style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, cursor: 'pointer', background: 'rgba(28,117,188,0.10)', border: '0.5px solid var(--color-accent)', maxWidth: 340 }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,210,255,0.14)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(28,117,188,0.10)')}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--gradient-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconLink size={15} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dbref.label}</div>
        {dbref.detail && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dbref.detail}</div>}
      </div>
      <IconExternalLink size={14} style={{ color: 'var(--color-accent-bright)', flexShrink: 0 }} />
    </div>
  );
}

const menuItem: React.CSSProperties = {
  width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
  borderRadius: 7, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left',
};

// New chat: pick 1 person (private DM) or several (group chat)
function NewChatModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { users, currentUserId, createOrOpenDM, createGroupChat } = useAppStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const candidates = users.filter((u) => u.id !== currentUserId && u.name.toLowerCase().includes(query.toLowerCase()));
  const isGroup = selected.length >= 2;

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const start = () => {
    if (selected.length === 0) return;
    const ch = selected.length === 1 ? createOrOpenDM(selected[0]) : createGroupChat(selected, name);
    onCreated(ch.id);
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '22%', left: '50%', transform: 'translateX(-50%)', width: 420, maxWidth: 'calc(100vw - 32px)', zIndex: 999, background: 'var(--color-bg-popover)', border: '0.5px solid var(--color-border-default)', borderRadius: 14, boxShadow: '0 24px 80px rgba(0,0,0,0.7)', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)' }}>New chat</span>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}><IconX size={16} /></button>
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
          Pick <b style={{ color: 'var(--color-text-secondary)' }}>one person</b> for a private chat, or <b style={{ color: 'var(--color-text-secondary)' }}>several</b> for a group chat.
        </p>

        {/* selected chips */}
        {selected.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {selected.map((id) => {
              const u = users.find((x) => x.id === id);
              return (
                <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 4px', borderRadius: 9999, background: 'var(--color-bg-active)' }}>
                  <Avatar user={u} size={20} />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)' }}>{u?.name.split(/\s+/)[0]}</span>
                  <button onClick={() => toggle(id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 0 }}><IconX size={12} /></button>
                </span>
              );
            })}
          </div>
        )}

        {isGroup && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name (optional)"
            style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none', marginBottom: 10, boxSizing: 'border-box', fontFamily: 'var(--font-sans)' }} />
        )}

        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people…"
          style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none', marginBottom: 10, boxSizing: 'border-box', fontFamily: 'var(--font-sans)' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 240, overflowY: 'auto', marginBottom: 18 }}>
          {candidates.map((u) => {
            const on = selected.includes(u.id);
            return (
              <div key={u.id} onClick={() => toggle(u.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 8, cursor: 'pointer', background: on ? 'var(--color-bg-active)' : 'transparent' }}
                onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, border: `1.5px solid ${on ? 'var(--color-accent)' : 'var(--color-border-strong)'}`, background: on ? 'var(--color-accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>{on && '✓'}</div>
                <Avatar user={u} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{u.email}</div>
                </div>
              </div>
            );
          })}
          {candidates.length === 0 && <div style={{ padding: 16, textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>No one found.</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '0.5px solid var(--color-border-default)', background: 'none', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={start} disabled={selected.length === 0}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: selected.length ? 'var(--gradient-accent)' : 'var(--color-bg-active)', color: selected.length ? '#fff' : 'var(--color-text-muted)', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: selected.length ? 'pointer' : 'default' }}>
            {selected.length <= 1 ? 'Start chat' : `Start group (${selected.length})`}
          </button>
        </div>
      </div>
    </>
  );
}

function MembersPopover({ channel, isDM, onClose }: { channel: Channel; isDM?: boolean; onClose: () => void }) {
  const { users, addChannelMember, removeChannelMember, currentUserId } = useAppStore();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    setTimeout(() => document.addEventListener('mousedown', h), 0);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  // For a DM, never let it drop below 2 people (you + one other)
  const otherCount = channel.member_ids.filter((id) => id !== currentUserId).length;
  return (
    <div ref={ref} style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, width: 250, zIndex: 100, background: 'var(--color-bg-popover)', border: '0.5px solid var(--color-border-default)', borderRadius: 10, boxShadow: '0 16px 56px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{isDM ? 'People in this chat' : 'Members'}</div>
        {isDM && <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>Adding someone makes it a group chat.</div>}
      </div>
      <div style={{ maxHeight: 280, overflowY: 'auto', padding: 4 }}>
        {users.map((u) => {
          const inChannel = channel.member_ids.includes(u.id);
          const isMe = u.id === currentUserId;
          // Block removing the last other person from a DM
          const blockRemove = isDM && inChannel && !isMe && otherCount <= 1;
          const disabled = isMe || blockRemove;
          return (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px', borderRadius: 6 }}>
              <Avatar user={u} size={26} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}{isMe && ' (you)'}</div>
              </div>
              <button onClick={() => { if (disabled) return; inChannel ? removeChannelMember(channel.id, u.id) : addChannelMember(channel.id, u.id); }}
                disabled={disabled}
                style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 9999, cursor: disabled ? 'default' : 'pointer', border: 'none',
                  background: inChannel ? 'var(--color-bg-active)' : 'var(--gradient-accent)',
                  color: inChannel ? 'var(--color-text-muted)' : '#fff', opacity: disabled ? 0.4 : 1 }}>
                {inChannel ? 'Remove' : 'Add'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NewChannelModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { users, currentUserId, createChannel } = useAppStore();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('IconMessage');
  const [color, setColor] = useState('#1c75bc');
  const [selected, setSelected] = useState<string[]>([currentUserId]);
  const COLORS = ['#1c75bc', '#a78bfa', '#2ee89a', '#fb923c', '#f472b6', '#00d2ff'];

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const create = () => {
    if (!name.trim()) return;
    const ch = createChannel(name, selected, { emoji: icon, color });
    onCreated(ch.id);
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '22%', left: '50%', transform: 'translateX(-50%)', width: 440, maxWidth: 'calc(100vw - 32px)', zIndex: 999, background: 'var(--color-bg-popover)', border: '0.5px solid var(--color-border-default)', borderRadius: 14, boxShadow: '0 24px 80px rgba(0,0,0,0.7)', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)' }}>New channel</span>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}><IconX size={16} /></button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
          <EmojiTile emoji={icon} color={color} size={44} />
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') create(); }}
            placeholder="Channel name (e.g. Marketing)"
            style={{ flex: 1, padding: '10px 12px', borderRadius: 9, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none', fontFamily: 'var(--font-sans)' }} />
        </div>

        {/* Icon picker */}
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Icon</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4, marginBottom: 14 }}>
          {CHANNEL_ICONS.map((ic) => {
            const on = ic === icon;
            return (
              <button key={ic} onClick={() => setIcon(ic)}
                style={{ height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: on ? color : 'var(--color-bg-active)', color: on ? '#fff' : color, transition: 'all 80ms' }}>
                <PageIcon name={ic} size={16} />
              </button>
            );
          })}
        </div>

        {/* Colour picker */}
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Colour</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} title={c}
              style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: c, cursor: 'pointer',
                outline: color === c ? `2px solid ${c}` : '2px solid transparent', outlineOffset: 2 }} />
          ))}
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Add members</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto', marginBottom: 18 }}>
          {users.map((u) => {
            const on = selected.includes(u.id);
            const isMe = u.id === currentUserId;
            return (
              <div key={u.id} onClick={() => !isMe && toggle(u.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 8, cursor: isMe ? 'default' : 'pointer', background: on ? 'var(--color-bg-active)' : 'transparent' }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, border: `1.5px solid ${on ? 'var(--color-accent)' : 'var(--color-border-strong)'}`, background: on ? 'var(--color-accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>{on && '✓'}</div>
                <Avatar user={u} size={28} />
                <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{u.name}{isMe && ' (you)'}</span>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '0.5px solid var(--color-border-default)', background: 'none', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={create} disabled={!name.trim()} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: name.trim() ? 'var(--gradient-accent)' : 'var(--color-bg-active)', color: name.trim() ? '#fff' : 'var(--color-text-muted)', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: name.trim() ? 'pointer' : 'default' }}>Create channel</button>
        </div>
      </div>
    </>
  );
}

// ─── Channel edit (admin only): icon / name / colour ──────────────────────────
function ChannelEditPopover({ channel, onClose }: { channel: Channel; onClose: () => void }) {
  const { updateChannel } = useAppStore();
  const ref = useRef<HTMLDivElement>(null);
  const [name, setName] = useState(channel.name);
  const [icon, setIcon] = useState(channelIconName(channel.emoji));
  const [color, setColor] = useState(channel.color ?? '#1c75bc');

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    setTimeout(() => document.addEventListener('mousedown', h), 0);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const commitName = () => { if (name.trim() && name !== channel.name) updateChannel(channel.id, { name: name.trim() }); };

  return (
    <div ref={ref} style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, width: 264, zIndex: 200, background: 'var(--color-bg-popover)', border: '0.5px solid var(--color-border-default)', borderRadius: 10, boxShadow: '0 16px 56px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 12px 8px', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Channel name</div>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onBlur={commitName}
          onKeyDown={(e) => { if (e.key === 'Enter') { commitName(); onClose(); } }}
          style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-sans)' }} />
      </div>
      <div style={{ padding: '10px 12px', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Icon</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 3 }}>
          {CHANNEL_ICONS.map((ic) => {
            const on = ic === icon;
            return (
              <button key={ic} onClick={() => { setIcon(ic); updateChannel(channel.id, { emoji: ic }); }}
                style={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: 'none', cursor: 'pointer', background: on ? color : 'var(--color-bg-active)', color: on ? '#fff' : color }}>
                <PageIcon name={ic} size={14} />
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Colour</div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {PAGE_COLORS.map((c) => (
            <button key={c} onClick={() => { setColor(c); updateChannel(channel.id, { color: c }); }} title={c}
              style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: c, cursor: 'pointer', outline: color === c ? `2px solid ${c}` : '2px solid transparent', outlineOffset: 2 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Database link picker: choose a database → row to share ───────────────────
function DbLinkPicker({ onPick, onClose }: { onPick: (ref: ChatMessage['dbref']) => void; onClose: () => void }) {
  const { databases, pages } = useAppStore();
  const ref = useRef<HTMLDivElement>(null);
  const [dbId, setDbId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    setTimeout(() => document.addEventListener('mousedown', h), 0);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const dbList = Object.values(databases).filter((d) => pages.some((p) => p.id === d.page_id && !p.owner_id));
  const db = dbId ? databases[dbId] : null;
  const page = db ? pages.find((p) => p.id === db.page_id) : null;
  const nameCol = db?.columns.find((c) => c.position === 0);

  const rows = db && nameCol
    ? db.rows.filter((r) => String(r.cells[nameCol.id] ?? '').toLowerCase().includes(query.toLowerCase())).slice(0, 50)
    : [];

  return (
    <div ref={ref} style={{ position: 'absolute', bottom: '100%', left: 20, marginBottom: 8, width: 320, maxHeight: 380, zIndex: 200, background: 'var(--color-bg-popover)', border: '0.5px solid var(--color-border-default)', borderRadius: 12, boxShadow: '0 16px 56px rgba(0,0,0,0.6)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 12px', borderBottom: '0.5px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
        {dbId && <button onClick={() => { setDbId(null); setQuery(''); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}><IconArrowLeft size={15} /></button>}
        <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{db ? `Pick a row · ${db.name}` : 'Link a database row'}</span>
        <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}><IconX size={15} /></button>
      </div>

      {!db ? (
        <div style={{ overflowY: 'auto', padding: 6 }}>
          {dbList.map((d) => {
            const p = pages.find((pp) => pp.id === d.page_id);
            return (
              <button key={d.id} onClick={() => setDbId(d.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                <span style={{ color: p?.iconColor ?? '#1c75bc', display: 'flex' }}><PageIcon name={p?.icon ?? 'IconDatabase'} size={16} /></span>
                <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{d.name}</span>
                <IconChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <div style={{ padding: '8px 12px', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search rows…"
              style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ overflowY: 'auto', padding: 6 }}>
            {rows.map((r) => {
              const title = nameCol ? String(r.cells[nameCol.id] ?? 'Untitled') : 'Untitled';
              return (
                <button key={r.id} onClick={() => onPick({
                  page_slug: page?.slug ?? '',
                  database_id: db.id,
                  row_id: r.id,
                  label: `${db.name} · ${title}`,
                  detail: db.columns.filter((c) => c.position !== 0 && r.cells[c.id]).slice(0, 1).map((c) => `${c.name}: ${String(r.cells[c.id])}`)[0],
                })}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                  <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
                  <IconLink size={13} style={{ color: 'var(--color-accent-bright)' }} />
                </button>
              );
            })}
            {rows.length === 0 && <div style={{ padding: 16, textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>No rows.</div>}
          </div>
        </>
      )}
    </div>
  );
}
