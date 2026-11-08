// Renders a racer/player token: uses a custom image if the theme racer
// provides one (racer.image), otherwise falls back to the emoji.
// Sized to match the surrounding font-size (1em x 1em) so it drops into
// existing emoji spans/classes without extra layout changes.
export default function RacerAvatar({ racer, className = '', style }) {
  if (!racer) return null

  if (racer.image) {
    return (
      <img
        src={racer.image}
        alt={racer.name || 'racer'}
        className={className}
        style={{
          width: '1em',
          height: '1em',
          objectFit: 'contain',
          display: 'inline-block',
          verticalAlign: 'middle',
          flexShrink: 0,
          ...style,
        }}
      />
    )
  }

  return <span className={className} style={style}>{racer.emoji}</span>
}
