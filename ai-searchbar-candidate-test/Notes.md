## Observations during implementation and testing

==== Iteration 1 Notes ====

- The whole synonym map and category extension can be made much better using AI, undoubtedly. Otherwise, we really need to be aware of all possible search terms users might use. We might also need to account for typos and slang. I am aware that it is the case in production, but it is worth mentioning. The mock setup is inherently limited in this regard, of course, but even with a more extensive synonym map, we might still miss some terms. 
   - I mention this because simply enriching the categories for the purpose of this test feels a bit contrived, as that is not a real fix for the underlying problem of understanding user intent, but rather a patch to cover some known gaps.

- About the `EventWithTickets` structure: It might be beneficial to add a `tags` or `labels` field to the event data structure. This field could contain an array of keywords or tags associated with the event, making it easier to match user queries with relevant events. For now, I see we have a single string for `category`, but multiple tags would allow for more nuanced searching.

- Hopefully, on the real website, there are fallbacks in place for situations when things don't resolve. One simple example I found was encountering events with a broken image URLs, causing them to glitch agressively when rendering the search results. We should ensure that there are default images or error handling for such cases to maintain a smooth user experience.

- The scoring mechanism is interesting, but it might need further refinement. For instance, we could consider implementing a more sophisticated ranking algorithm that takes into account factors like event popularity, recency, and user preferences. Not really a priority, but this would help ensure that the most relevant events are prioritized in the search results. Otherwise, subjective arbitrary weights might not yield the best user experience. However, we could indeed have some custom weights for "featured" events (e.g., sponsored events).

- Some kind of user testing would be beneficial to validate the effectiveness of the search functionality. Gathering feedback from actual users can provide insights into how well the search meets their needs and whether there are any areas for improvement. In general, we should be cautious about assuming that our own understanding of relevance aligns with that of the users. We also don't want to skew results too much, so as not to create an echo chamber effect where only certain events are shown. The sense of discovery should be preserved. 

==== Iteration 2 Notes ====

- The search results seem a bit too generous at the moment. For example, searching for "rock concert" returns a lot of events that are not rock concerts at all, just because they have some related keywords in their descriptions. We might want to tighten the relevance criteria to ensure that the results are more focused and truly relevant to the user's query. Another example is for "quiz night", which returns many non-quiz events, but rather matches on common words like "night" or "event". We could consider implementing a minimum relevance score threshold to filter out less relevant results.
   - For this test, I added a list of common/generic words that should have lower weight in scoring, to reduce their impact on relevance. This should help improve the quality of search results by prioritizing more specific and meaningful matches.
   - This should, ideally, not be as hardcoded, but rather learned from user behavior over time. However, for the purpose of this test, a static list should suffice to demonstrate the concept.
   - Additionally, I created some tiering logic to help separate clearly relevant results from borderline ones. This can help in presenting results in a more structured way, allowing users to see the most relevant events first. This needs to be tuned further, of course. The current thresholds are somewhat arbitrary and may need adjustment based on real user feedback and testing.

- Something like "Jazz music tonight" is a bit too specific for the current mock data, as there are no events that exactly match that query. However, the search does return jazz-related events, which is good. In a real-world scenario, we might want to implement some form of fuzzy matching or partial matching to handle such cases better. 
   - Additionally, we could consider implementing a fallback mechanism that suggests related events or categories when no exact matches are found. This would help ensure that users still find relevant content even if their initial query doesn't yield direct results.


==== Iteration 3 Notes  ====

(General thoughts, a bit beyond the scope of the test):

- Potential avenues for improvement for the search bar, in general, irrespective of AI usage: 
  - Autocomplete suggestions as the user types, to help guide their queries and improve search accuracy. (NECESSARY for mobile, for web.. depends)
  - (Somewhat mentioned already) Smart relevance.
- It's good that the platform already has placeholder text and "chips" to showcase the search bar has more advanced AI capabilities.
  - We could also show what the AI understood from the query, e.g., "Searching for events related to 'rock concerts' happening this weekend in London", to reassure users that the AI is processing their intent correctly. Transparency and interpretability are important.
- We need to make sure traditional keyword search still works well, as not all users will want to use AI-powered search. Some users might prefer the simplicity and control of traditional search methods.
- Very far along the line, and probably tricky to implement, but we could use each user's context and preferences to personalize search results. This could involve learning from their past searches, event attendance, and interactions on the platform to tailor results to their interests. (Won't work before we have user accounts and history tracking, though.) (Shouldn't be a priority, though, but worth keeping in mind for the future.)
- We also need to think if we prefer infinite scrolling or pagination for search results. Each has its pros and cons, and the choice might depend on the typical user behavior on the platform. For this test, infinite scrolling is fine.
- Caching results (for performance and cost efficiency).


(Back to the test specifically):

- Clicking on the example chips currently populates the search bar but does not trigger the search automatically. It would be more user-friendly if clicking a chip would immediately perform the search, reducing the number of clicks required from the user. Peronally, I think it's more intuitive since the user is explicitly indicating interest in that query and they appear to be "call-to-action" elements.

