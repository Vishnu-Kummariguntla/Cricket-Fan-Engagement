import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../account/AuthProvider'
import { createDebateResponse, fanDebatePrompts, listDebateResponses } from './fanDebateStore'
import { addFanPostReply, createFanPost, listPublicFanPosts, updateFanPostReaction } from './fanPostStore'
import { listDirectMessages, listFollowing, listNetworkUsers, sendDirectMessage, toggleFollow } from './networkSocialStore'

const reactionLabels = [
  ['like', '👍', 'Like'],
  ['dislike', '👎', 'Dislike'],
  ['fire', '🔥', 'Fire'],
  ['clap', '👏', 'Respect'],
]

function getImageDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('')
      return
    }

    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function getPostAuthor(post) {
  return {
    userId: post.userId,
    displayName: post.userName || 'Cricket Fan',
    username: post.userName || 'Cricket Fan',
    photoURL: post.userAvatar || '',
    favoriteFranchise: post.userFavoriteFranchise || '',
    favoritePlayer: post.userFavoritePlayer || '',
  }
}

function FanPostCard({ followingIds, onFollow, onOpenProfile, onReact, onReply, post, user }) {
  const [replyText, setReplyText] = useState('')
  const created = post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Just now'
  const replies = post.replies ?? []
  const ownPost = user?.uid === post.userId
  const following = followingIds.has(post.userId)

  const submitReply = async (event) => {
    event.preventDefault()
    const body = replyText.trim()
    if (!body) return
    await onReply(post, body)
    setReplyText('')
  }

  return (
    <article className="network-post-card">
      <button className="network-post-author" onClick={() => onOpenProfile(post)} type="button">
        <span>
          {post.userAvatar ? <img alt={`${post.userName || 'Cricket Fan'} avatar`} src={post.userAvatar} /> : (post.userName || 'CF').slice(0, 2).toUpperCase()}
        </span>
        <div>
          <strong>{post.userName || 'Cricket Fan'}</strong>
          <small>{created}</small>
        </div>
      </button>

      {!ownPost && (
        <div className="network-post-social-actions">
          <button onClick={() => onFollow(getPostAuthor(post))} type="button">
            {following ? 'Following' : 'Follow'}
          </button>
          <span>{following ? 'Added to your cricket network' : 'Follow from posts, then message from the Messages tab'}</span>
        </div>
      )}

      <div className="network-post-copy">
        <h2>{post.data?.title}</h2>
        <p>{post.data?.body}</p>
      </div>

      {post.data?.image && (
        <img className="network-post-image" alt={`${post.data.title} upload`} src={post.data.image} />
      )}

      {post.data?.linkedResult && <p className="network-linked-result">Linked result: {post.data.linkedResult}</p>}

      <div className="network-reactions" aria-label="Post reactions">
        {reactionLabels.map(([type, icon, label]) => {
          const userIds = post.reactions?.[type] ?? []
          const active = user?.uid && userIds.includes(user.uid)
          return (
            <button className={active ? 'active' : ''} key={type} onClick={() => onReact(post, type)} type="button">
              <b aria-hidden="true">{icon}</b>
              {label}
              <span>{userIds.length}</span>
            </button>
          )
        })}
      </div>

      <div className="network-replies">
        <span>{replies.length} repl{replies.length === 1 ? 'y' : 'ies'}</span>
        {replies.slice(-3).map((reply) => (
          <div className="network-reply" key={reply.id}>
            <strong>{reply.userName}</strong>
            <p>{reply.body}</p>
          </div>
        ))}
        <form onSubmit={submitReply}>
          <input onChange={(event) => setReplyText(event.target.value)} placeholder="Reply to this post" value={replyText} />
          <button type="submit">Reply</button>
        </form>
      </div>
    </article>
  )
}

function MessagingPanel({
  messages,
  messageText,
  onMessageText,
  onSearch,
  onSelectUser,
  onSendMessage,
  searchText,
  selectedUser,
  users,
  user,
}) {
  return (
    <section className="network-messaging-panel">
      <div className="network-section-heading">
        <span>Direct Messages</span>
        <strong>Search fans and start a cricket conversation.</strong>
      </div>

      <div className="network-message-layout">
        <aside className="network-user-search">
          <label>
            Search People
            <input onChange={(event) => onSearch(event.target.value)} placeholder="Username, player, or team" value={searchText} />
          </label>
          <div>
            {users.length ? users.map((profile) => (
              <button className={selectedUser?.userId === profile.userId ? 'active' : ''} key={profile.userId} onClick={() => onSelectUser(profile)} type="button">
                <span>{profile.photoURL ? <img alt={`${profile.displayName} avatar`} src={profile.photoURL} /> : profile.displayName.slice(0, 2).toUpperCase()}</span>
                <div>
                  <strong>{profile.displayName}</strong>
                  <small>{profile.favoritePlayer || profile.favoriteFranchise || 'Cricket fan'}</small>
                </div>
              </button>
            )) : (
              <p>No matching fans yet.</p>
            )}
          </div>
        </aside>

        <section className="network-message-thread">
          {selectedUser ? (
            <>
              <div className="network-message-recipient">
                <span>{selectedUser.photoURL ? <img alt={`${selectedUser.displayName} avatar`} src={selectedUser.photoURL} /> : selectedUser.displayName.slice(0, 2).toUpperCase()}</span>
                <div>
                  <strong>{selectedUser.displayName}</strong>
                  <small>{selectedUser.favoritePlayer || selectedUser.favoriteFranchise || 'Cricket fan'}</small>
                </div>
              </div>
              <div className="network-message-list">
                {messages.length ? messages.map((message) => (
                  <p className={message.senderId === user?.uid ? 'mine' : ''} key={message.id}>
                    <span>{message.body}</span>
                    <small>{message.createdAt ? new Date(message.createdAt).toLocaleString() : 'Just now'}</small>
                  </p>
                )) : (
                  <p className="network-empty-thread">No messages yet.</p>
                )}
              </div>
              <form className="network-message-form" onSubmit={onSendMessage}>
                <input onChange={(event) => onMessageText(event.target.value)} placeholder="Write a direct message" value={messageText} />
                <button type="submit">Send</button>
              </form>
            </>
          ) : (
            <div className="network-message-placeholder">
              <span>Messages</span>
              <strong>Select a fan to message.</strong>
              <p>Search public profiles or users who have posted in the Network.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

function DebatePanel({
  debateForm,
  debateResponses,
  onDebateForm,
  onPrivateDebate,
  onSelectPrompt,
  onSubmitResponse,
  selectedPrompt,
}) {
  return (
    <section className="network-debate-panel">
      <div className="network-section-heading">
        <span>Fan Debates</span>
        <strong>Pick a prompt, make your case, and challenge another fan privately.</strong>
      </div>

      <div className="network-debate-layout">
        <aside className="network-debate-prompts">
          {fanDebatePrompts.map((prompt) => (
            <button className={selectedPrompt.id === prompt.id ? 'active' : ''} key={prompt.id} onClick={() => onSelectPrompt(prompt)} type="button">
              <strong>{prompt.title}</strong>
              <small>{prompt.context}</small>
            </button>
          ))}
        </aside>

        <section className="network-debate-room">
          <div className="network-debate-current">
            <span>Current Debate</span>
            <strong>{selectedPrompt.title}</strong>
            <p>{selectedPrompt.context}</p>
          </div>

          <form className="network-debate-form" onSubmit={onSubmitResponse}>
            <input onChange={(event) => onDebateForm((current) => ({ ...current, stance: event.target.value }))} placeholder="Your answer, e.g. Virat Kohli" value={debateForm.stance} />
            <textarea onChange={(event) => onDebateForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Give your reasons. Use stats, context, pressure, conditions, or moments." rows={4} value={debateForm.reason} />
            <button type="submit">Post Response</button>
          </form>

          <div className="network-debate-responses">
            <span>{debateResponses.length} response{debateResponses.length === 1 ? '' : 's'}</span>
            {debateResponses.length ? debateResponses.map((response) => (
              <article key={response.id}>
                <div className="network-debate-author">
                  <span>{response.userAvatar ? <img alt={`${response.userName} avatar`} src={response.userAvatar} /> : response.userName.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <strong>{response.userName}</strong>
                    <small>{response.createdAt ? new Date(response.createdAt).toLocaleString() : 'Just now'}</small>
                  </div>
                </div>
                <h3>{response.stance}</h3>
                <p>{response.reason}</p>
                <button onClick={() => onPrivateDebate(response)} type="button">Debate Privately</button>
              </article>
            )) : (
              <p className="network-status">No responses yet. Start the debate.</p>
            )}
          </div>
        </section>
      </div>
    </section>
  )
}

export default function NetworkPage({ initialTab = 'create', onNavigate }) {
  const { openAuthModal, user } = useAuth()
  const [form, setForm] = useState({ title: '', body: '', linkedResult: '' })
  const [image, setImage] = useState('')
  const [imageName, setImageName] = useState('')
  const [posts, setPosts] = useState([])
  const [status, setStatus] = useState('Loading fan posts...')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState(initialTab)
  const [followingIds, setFollowingIds] = useState(new Set())
  const [messageUsers, setMessageUsers] = useState([])
  const [messageSearch, setMessageSearch] = useState('')
  const [selectedMessageUser, setSelectedMessageUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [selectedDebatePrompt, setSelectedDebatePrompt] = useState(fanDebatePrompts[0])
  const [debateResponses, setDebateResponses] = useState([])
  const [debateForm, setDebateForm] = useState({ stance: '', reason: '' })
  const canPost = Boolean(user && form.title.trim() && form.body.trim())
  const totalReactions = useMemo(() => posts.reduce((total, post) => (
    total + Object.values(post.reactions ?? {}).reduce((sum, userIds) => sum + userIds.length, 0)
  ), 0), [posts])

  const refreshPosts = async () => {
    try {
      const items = await listPublicFanPosts()
      setPosts(items)
      setStatus(items.length ? '' : 'No posts yet. Start the first cricket conversation.')
    } catch (error) {
      setStatus(error?.code === 'permission-denied' ? 'Firestore blocked public fan posts. Check published rules.' : 'Fan posts could not load.')
    }
  }

  useEffect(() => {
    void refreshPosts()
  }, [])

  useEffect(() => {
    if (['create', 'feed', 'debates', 'messages'].includes(initialTab)) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  useEffect(() => {
    if (!user) {
      setFollowingIds(new Set())
      return
    }

    listFollowing(user.uid)
      .then((items) => setFollowingIds(new Set(items.map((item) => item.followingId))))
      .catch((error) => console.warn('Unable to load follows', error))
  }, [user])

  useEffect(() => {
    if (activeTab !== 'messages') return
    listNetworkUsers(messageSearch)
      .then((profiles) => setMessageUsers(profiles.filter((profile) => profile.userId !== user?.uid)))
      .catch((error) => console.warn('Unable to search network users', error))
  }, [activeTab, messageSearch, user?.uid])

  useEffect(() => {
    if (activeTab !== 'debates') return
    listDebateResponses(selectedDebatePrompt.id)
      .then(setDebateResponses)
      .catch((error) => console.warn('Unable to load debate responses', error))
  }, [activeTab, selectedDebatePrompt.id])

  useEffect(() => {
    if (!user?.uid || !selectedMessageUser?.userId) {
      setMessages([])
      return
    }

    listDirectMessages(user.uid, selectedMessageUser.userId)
      .then(setMessages)
      .catch((error) => console.warn('Unable to load direct messages', error))
  }, [selectedMessageUser?.userId, user?.uid])

  const updateImage = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setStatus('Upload an image file.')
      return
    }
    if (file.size > 850000) {
      setStatus('Use an image under 850 KB for now.')
      return
    }
    setImage(await getImageDataUrl(file))
    setImageName(file.name)
    setStatus('')
  }

  const submitPost = async (event) => {
    event.preventDefault()
    if (!user) {
      openAuthModal('signIn')
      return
    }
    if (!canPost) return

    setSaving(true)
    setStatus('')
    try {
      const post = await createFanPost(user, { ...form, image })
      setPosts((current) => [post, ...current])
      setForm({ title: '', body: '', linkedResult: '' })
      setImage('')
      setImageName('')
      setStatus('Posted to the fan network.')
    } catch (error) {
      setStatus(error?.code === 'permission-denied' ? 'Firestore blocked this post. Check published rules.' : 'Post failed.')
    } finally {
      setSaving(false)
    }
  }

  const reactToPost = async (post, reactionType) => {
    if (!user) {
      openAuthModal('signIn')
      return
    }
    const updated = await updateFanPostReaction(post, user, reactionType)
    setPosts((current) => current.map((item) => (item.id === updated.id ? updated : item)))
  }

  const replyToPost = async (post, body) => {
    if (!user) {
      openAuthModal('signIn')
      return
    }
    const updated = await addFanPostReply(post, user, body)
    setPosts((current) => current.map((item) => (item.id === updated.id ? updated : item)))
  }

  const openPublicProfile = (post) => {
    const userId = post?.userId
    if (!userId) return
    const profileFallback = {
      userName: post.userName || '',
      userAvatar: post.userAvatar || '',
      favoriteFranchise: post.userFavoriteFranchise || (post.userId === user?.uid ? user.favoriteFranchise : '') || '',
      favoritePlayer: post.userFavoritePlayer || (post.userId === user?.uid ? user.favoritePlayer : '') || '',
    }
    window.sessionStorage.setItem(`cricket-public-profile-fallback.${userId}`, JSON.stringify(profileFallback))
    onNavigate('publicProfile', { userId })
  }

  const followUser = async (targetUser) => {
    if (!user) {
      openAuthModal('signIn')
      return
    }

    const result = await toggleFollow(user, targetUser)
    setFollowingIds((current) => {
      const next = new Set(current)
      if (result.following) next.add(targetUser.userId)
      else next.delete(targetUser.userId)
      return next
    })
  }

  const sendMessage = async (event) => {
    event.preventDefault()
    if (!user) {
      openAuthModal('signIn')
      return
    }
    if (!selectedMessageUser || !messageText.trim()) return

    const sent = await sendDirectMessage(user, selectedMessageUser, messageText)
    if (sent) setMessages((current) => [...current, sent])
    setMessageText('')
  }

  const submitDebateResponse = async (event) => {
    event.preventDefault()
    if (!user) {
      openAuthModal('signIn')
      return
    }

    const response = await createDebateResponse(user, selectedDebatePrompt, debateForm)
    if (response) {
      setDebateResponses((current) => [response, ...current])
      setDebateForm({ stance: '', reason: '' })
    }
  }

  const startPrivateDebate = (response) => {
    if (!user) {
      openAuthModal('signIn')
      return
    }
    if (response.userId === user.uid) return

    const targetUser = {
      userId: response.userId,
      displayName: response.userName,
      username: response.userName,
      photoURL: response.userAvatar || '',
    }
    setSelectedMessageUser(targetUser)
    setMessageText(`Debate: ${response.promptTitle} — I saw your answer "${response.stance}" and `)
    onNavigate('network', { tab: 'messages' })
  }

  return (
    <section className="network-page pointer-reactive">
      <div className="network-hero">
        <div>
          <span>Fan Network</span>
          <h1>Post reactions, predictions, and cricket takes.</h1>
          <p>Create public fan posts, attach images, react to other users, and build reply threads around IPL moments.</p>
        </div>
        <div className="network-stats">
          <div><strong>{posts.length}</strong><span>Posts</span></div>
          <div><strong>{totalReactions}</strong><span>Reactions</span></div>
        </div>
      </div>

      <div className="network-layout">
        {activeTab === 'create' ? (
          <form className="network-composer" onSubmit={submitPost}>
            <div className="network-section-heading">
              <span>Create Post</span>
              <strong>Publish a fan take, strategy, or prediction.</strong>
            </div>
            <input onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Post title" value={form.title} />
            <textarea onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} placeholder="Share a match reaction, auction strategy, prediction, or player opinion" rows={5} value={form.body} />
            <input onChange={(event) => setForm((current) => ({ ...current, linkedResult: event.target.value }))} placeholder="Optional linked saved result or context" value={form.linkedResult} />
            <label className="network-upload">
              <span>Choose Image</span>
              <small>{imageName || 'PNG, JPG, or WebP under 850 KB'}</small>
              <input accept="image/*" onChange={updateImage} type="file" />
            </label>
            {image && (
              <div className="network-image-preview">
                <img alt="Post upload preview" src={image} />
                <button onClick={() => { setImage(''); setImageName('') }} type="button">Remove Image</button>
              </div>
            )}
            <button disabled={saving || (user && !canPost)} type="submit">{saving ? 'Posting...' : user ? 'Publish Post' : 'Sign In to Post'}</button>
            {status && <p className="network-status">{status}</p>}
          </form>
        ) : activeTab === 'feed' ? (
          <div className="network-feed">
            <div className="network-section-heading">
              <span>View Other Posts</span>
              <strong>Follow users from their posts and build your cricket network.</strong>
            </div>
            {status && !posts.length && <p className="network-status">{status}</p>}
            {posts.map((post) => (
              <FanPostCard followingIds={followingIds} key={post.id} onFollow={followUser} onOpenProfile={openPublicProfile} onReact={reactToPost} onReply={replyToPost} post={post} user={user} />
            ))}
          </div>
        ) : activeTab === 'debates' ? (
          <DebatePanel
            debateForm={debateForm}
            debateResponses={debateResponses}
            onDebateForm={setDebateForm}
            onPrivateDebate={startPrivateDebate}
            onSelectPrompt={setSelectedDebatePrompt}
            onSubmitResponse={submitDebateResponse}
            selectedPrompt={selectedDebatePrompt}
          />
        ) : (
          <MessagingPanel
            messages={messages}
            messageText={messageText}
            onMessageText={setMessageText}
            onSearch={setMessageSearch}
            onSelectUser={setSelectedMessageUser}
            onSendMessage={sendMessage}
            searchText={messageSearch}
            selectedUser={selectedMessageUser}
            user={user}
            users={messageUsers}
          />
        )}
      </div>
    </section>
  )
}
