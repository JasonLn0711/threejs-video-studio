"""Pure PCM tail measurement shared by cinematic audio verification."""
RATE = 48000

def trailing_silence(pcm, channels=2, threshold_db=-50):
    """Last above-threshold sample, independently of caption/clip metadata."""
    threshold = 32768 * 10 ** (threshold_db / 20)
    total = len(pcm) // channels
    for frame in range(total - 1, -1, -1):
        if any(abs(pcm[frame * channels + c]) >= threshold for c in range(channels)):
            return (total - frame - 1) / RATE
    return total / RATE
