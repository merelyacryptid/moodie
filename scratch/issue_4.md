### 🎯 Problem Statement
In wellness apps testing multiple lifestyle habits against mood, naive correlations suffer severely from the **multiple hypothesis testing problem**.
- With ~25 activities and a significance level of $\alpha = 0.05$, testing each separately yields a Family-Wise Error Rate (FWER) of:
  $$1 - (1 - 0.05)^{25} \approx 72.3\%$$
- This means almost **3 out of 4 users will see a "significant correlation" that is purely random noise** (e.g., if a user logs Shopping on 2 lucky days, the app will falsely claim Shopping dramatically boosts their happiness).

### 📐 Statistical Solution: The Benjamini-Hochberg (BH) Procedure
Rather than Bonferroni correction (which is overly conservative and suppresses real insights in small personal datasets), we implement the **Benjamini-Hochberg False Discovery Rate (FDR)** procedure in `src/lib/discoveries.ts`:

1. **Hypothesis Testing**:
   - For each activity $i$ with minimum sample size $n \ge 4$, compare mood distributions between days with activity $i$ vs. days without activity $i$ using a two-sample Welch's t-test or Mann-Whitney U test.
   - Obtain raw p-values: $p_1, p_2, \dots, p_m$.
2. **BH Ranking**:
   - Sort p-values in ascending order: $p_{(1)} \le p_{(2)} \le \dots \le p_{(m)}$.
   - Set FDR threshold $Q = 0.10$ (allowing a gentle, exploratory threshold suitable for self-reflection).
   - Find the largest index $k$ such that:
     $$p_{(k)} \le \frac{k}{m} \cdot Q$$
   - Reject null hypotheses $1 \dots k$. These activities are classified as **Statistically Vetted Discoveries**.
3. **Effect Size (Cohen's $d$)**:
   - Calculate Cohen's $d = \frac{\bar{x}_1 - \bar{x}_2}{s_{\text{pooled}}}$.
   - Filter out statistically significant but practically negligible differences ($|d| < 0.40$).
4. **Graduated Insight Tiers**:
   - **Confirmed Discoveries**: Pass BH FDR test with $|d| \ge 0.40$.
   - **Emerging Patterns**: $n \ge 3$, positive lift, but not yet meeting the BH threshold (*"Early pattern: Needs a few more reflections to confirm"*).

### 🔍 User Verification & Micro-Experiments Loop
1. **Resonance Check**:
   - On each discovery card, include a subtle verification question:
     > *"Does this ring true to you?"*
     > `[🌟 Yes, definitely]` `[🌿 Not quite]` `[🔍 Still noticing]`
   - If the user selects "Not quite", downrank or mute that discovery.
2. **7-Day Micro-Experiments**:
   - Let users test discoveries empirically:
     > *"Test this discovery: Try Reading on 4 days this week."*
   - Moodie tracks mood during the experiment and compares it to the baseline to show whether the effect replicated.

### ✅ Acceptance Criteria
- [ ] Statistical test utilities (t-test / Mann-Whitney U, Cohen's d, p-value calculation) implemented in `src/lib/discoveries.ts`.
- [ ] Benjamini-Hochberg procedure implemented to control False Discovery Rate at $Q = 0.10$.
- [ ] Multi-tiered discovery cards (Confirmed Discoveries vs. Emerging Patterns).
- [ ] User resonance feedback loop on discovery cards.
- [ ] Optional 7-day micro-experiment tracking flow.
