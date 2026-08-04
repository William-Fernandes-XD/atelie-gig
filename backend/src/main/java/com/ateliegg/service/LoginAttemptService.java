package com.ateliegg.service;

import com.ateliegg.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Proteção contra brute force no login.
 * A cada senha errada, o bloqueio aumenta em 5 segundos, até o máximo de 5 minutos.
 */
@Service
public class LoginAttemptService {

    private static final int INCREMENT_SECONDS = 5;
    private static final int MAX_LOCK_SECONDS = 300; // 5 minutos

    private final Map<String, AttemptState> attempts = new ConcurrentHashMap<>();

    public void assertNotLocked(String email) {
        String key = normalize(email);
        AttemptState state = attempts.get(key);
        if (state == null || state.lockedUntil == null) {
            return;
        }
        Instant now = Instant.now();
        if (now.isBefore(state.lockedUntil)) {
            long remaining = Math.max(1, state.lockedUntil.getEpochSecond() - now.getEpochSecond());
            throw new BusinessException(
                    "Muitas tentativas incorretas. Aguarde para tentar novamente.",
                    HttpStatus.TOO_MANY_REQUESTS,
                    Map.of("retryAfterSeconds", remaining));
        }
    }

    public void registerFailure(String email) {
        String key = normalize(email);
        attempts.compute(key, (k, current) -> {
            int failures = (current == null ? 0 : current.failures) + 1;
            int lockSeconds = Math.min(MAX_LOCK_SECONDS, failures * INCREMENT_SECONDS);
            return new AttemptState(failures, Instant.now().plusSeconds(lockSeconds));
        });
    }

    public void registerSuccess(String email) {
        attempts.remove(normalize(email));
    }

    public int currentLockSeconds(String email) {
        AttemptState state = attempts.get(normalize(email));
        if (state == null || state.lockedUntil == null) {
            return 0;
        }
        long remaining = state.lockedUntil.getEpochSecond() - Instant.now().getEpochSecond();
        return (int) Math.max(0, remaining);
    }

    private static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private static String formatDuration(long totalSeconds) {
        long minutes = totalSeconds / 60;
        long seconds = totalSeconds % 60;
        if (minutes <= 0) {
            return seconds + (seconds == 1 ? " segundo" : " segundos");
        }
        if (seconds == 0) {
            return minutes + (minutes == 1 ? " minuto" : " minutos");
        }
        return minutes + " min e " + seconds + " s";
    }

    private static final class AttemptState {
        private final int failures;
        private final Instant lockedUntil;

        private AttemptState(int failures, Instant lockedUntil) {
            this.failures = failures;
            this.lockedUntil = lockedUntil;
        }
    }
}
