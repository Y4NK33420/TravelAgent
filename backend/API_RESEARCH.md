A Strategic Analysis of Accommodation & Transport Data Integration for Modern Travel PlatformsSection 1: Executive Summary and Strategic Recommendations1.1. Overview of the Data Sourcing LandscapeThe development of modern travel technology platforms hinges on the strategic acquisition of comprehensive, accurate, and real-time data for accommodation and transportation. The central challenge lies in navigating a complex landscape of data sources, each presenting a distinct trade-off between stability, cost, data richness, and legal compliance. This landscape is broadly divided into two primary categories: sanctioned, official Application Programming Interfaces (APIs) and third-party scraping solutions.Official APIs, offered by Global Distribution Systems (GDS) like Amadeus and major Online Travel Agencies (OTAs) such as Booking.com and Expedia Group, provide a stable, legally sound, and transaction-ready pathway to inventory. However, they often come with restrictive partnership agreements, specific data structure limitations, and business models (commission-based) that may not align with all application types.Conversely, web scraping and Search Engine Results Page (SERP) APIs, provided by services like SerpApi and Apify, offer unparalleled data completeness by capturing everything visible to a human user. This approach provides flexibility and a comprehensive market view but introduces significant technical fragility and legal risk. The terms of service for major OTAs explicitly prohibit automated data extraction, making reliance on scraping a precarious foundation for a production system.This report provides a detailed analysis of these options, evaluating key providers against a matrix of technical, commercial, and legal criteria to inform a robust and scalable data integration strategy.1.2. Top-Line RecommendationsFollowing an exhaustive analysis of the available data sources, the following strategic recommendations are proposed:Primary Accommodation Source: The Amadeus Self-Service API is the top recommendation for the core production system. It offers direct GDS access to a vast global inventory, a transparent pay-as-you-go pricing model with a generous free tier, excellent documentation, and an official Python SDK. This combination provides the best balance of data depth, scalability, cost-effectiveness, and legal certainty for a new travel platform.1Secondary Accommodation Source: SerpApi's Google Hotels API is recommended as a strong secondary or supplementary source. Its primary advantage is providing an aggregated, multi-provider view of pricing and availability in a simple, easy-to-consume JSON format.4 While SerpApi offers a "U.S. Legal Shield," its use for a primary, commercial application remains in a legally gray area, making it more suitable for market analysis or as a fallback provider rather than the core transactional engine.5Primary Flight Search Source: The Amadeus Flight Offers Search API is the recommended choice. Its integration within the broader Amadeus ecosystem, direct GDS access to over 400 airlines, and a compelling pricing incentive that discounts search costs by 90% when using its booking API make it the most powerful and commercially viable option for a scalable solution.2Secondary Flight Search Source: Skyscanner's Travel APIs represent a robust alternative. As a leading meta-search engine, it provides excellent coverage, including many low-cost carriers, through an affiliate-based model.7 This is a suitable option if the application's business model is primarily based on affiliate referrals rather than direct bookings.Multi-Modal Transport Planning: The Google Maps Platform Routes API is the definitive recommendation for all multi-modal and local transit planning. With the Rome2rio API no longer accepting new partners, Google's API stands as the most comprehensive, globally available, and well-documented solution for generating door-to-door routes that include walking, driving, and detailed public transit legs.9 For sourcing bookable inter-city train and bus tickets, particularly in Europe, the Omio Affiliate API is the best-in-class aggregator.111.3. The API vs. Scraping VerdictThe analysis concludes that a hybrid, multi-layered strategy is the optimal approach. Official, sanctioned APIs must form the backbone of the application's core functionality—specifically, live search, pricing, and booking workflows. The stability, performance guarantees, and legal compliance offered by providers like Amadeus and Google are non-negotiable for building a trustworthy and scalable transactional platform.Web scraping solutions should be strategically deployed for supplementary, non-critical functions. Their value lies in asynchronous data enrichment tasks, such as broad market price intelligence, competitor analysis, or aggregating review sentiment. By isolating these high-risk activities from the primary user-facing application, the platform can benefit from the data richness of scraping while mitigating the associated legal and technical liabilities. This architectural separation ensures that if a scraper breaks or faces legal challenges, the core functionality of the application remains unaffected.Section 2: Accommodation Data Source AnalysisThis section presents a detailed evaluation of the primary data sources for accommodation, categorized by access method. Each source is analyzed based on its capabilities, business model, technical requirements, and strategic limitations.2.1. Direct Platform APIs (The Walled Gardens)Direct APIs from major OTAs offer access to proprietary, high-quality inventory. However, this access is typically governed by partnership agreements that prioritize the OTA's business model, often imposing significant restrictions on data usage.2.1.1. Booking.com Demand APIThe Booking.com Demand API is not a standard, self-service SaaS product but rather an integration framework for established "Managed Affiliate Partners".13 This implies a formal business relationship and approval process is a prerequisite for access.Capabilities: The platform is a comprehensive RESTful API that returns JSON responses and provides access to Booking.com's full inventory of accommodation, car rentals, and flights.14 The accommodation endpoints allow for detailed searches with a wide array of filters, including location (city, landmark), price range, ratings, meal plans, and property type.14 The API also provides dedicated endpoints for retrieving property details and guest reviews.15 The developer portal includes code examples for multiple languages, including Python, facilitating integration.14Limitations and Costs: The commercial model is a significant consideration. It is not a pay-per-call service but a commission-based affiliate program.16 Affiliates earn a percentage, typically starting at 25%, of the commission that Booking.com itself receives from the property owner (which is usually 15-20% of the total booking value).18 This structure makes it difficult to forecast revenue on a per-API-call basis and aligns the partner's success directly with generating confirmed stays.Furthermore, the API's Terms of Service are highly restrictive. Partners are strictly forbidden from caching availability or pricing data, using the data for price comparison against other platforms, or forwarding the data to any third party.21 These limitations severely constrain the architectural and business model flexibility of the integrating application. Technically, the API is rate-limited to ensure stability, with a default of 50 requests per minute (RPM) in the sandbox environment. Production rate limits are higher but require negotiation with a dedicated account manager for any significant increases.222.1.2. Expedia Group Rapid APISimilar to Booking.com, the Expedia Group Rapid API is a partner-centric solution designed to distribute its global inventory of over 700,000 properties.23 It is marketed as a modern, fast, and modular API that allows partners to integrate only the components they need.23Capabilities: The core of the offering is the Shopping API, which provides live rates and availability for up to 250 properties per request. The response includes crucial transactional details like promotional offers, refundability status, and a full breakdown of cancellation penalties.25 However, this API is specifically for dynamic data. Rich, static content such as property descriptions, a full list of amenities, photos, and guest reviews must be retrieved through separate, dedicated APIs like the Property Content API and the Rapid Guest Reviews API.25 This multi-API architecture requires a more complex integration to build a complete user experience.Limitations and Costs: The business model is commission-based, where partners earn on qualified bookings completed through the API.27 There are no public, self-service pricing tiers; partnership and integration involve direct engagement with Expedia Group, and third-party estimates suggest that a full integration project could incur significant development costs, potentially in the range of $30,000 to $60,000.31Rate limiting on the Rapid API is sophisticated and directly tied to commercial performance. The system calculates a "load" factor for each request, defined as (number of properties) x (number of rooms) x (number of nights). Daily quotas are allocated based on a partner's historical traffic-to-revenue ratio, with new partners given a generous initial allowance. Exceeding the daily quota results in a significant reduction of the per-minute rate limit, which can impact service availability.32 While SDKs are available for some languages like Java, an official Python SDK is not explicitly mentioned in the documentation.332.2. GDS and Aggregator APIs (The Supermarkets)GDS and aggregator APIs serve as central marketplaces, consolidating inventory from a vast number of suppliers into a single, unified interface. They represent a powerful alternative to integrating with individual OTAs.2.2.1. Amadeus Self-Service APIThe Amadeus Self-Service API suite marks a significant evolution in GDS access, making enterprise-grade travel data accessible to developers, startups, and smaller businesses through a modern, developer-first platform.6 It provides direct access to the Amadeus GDS, which includes an inventory of over 150,000 hotels worldwide.1Capabilities: The hotel booking workflow is logically structured across a suite of RESTful APIs. Developers first use the Hotel List API to discover properties based on criteria like city or geocode. Subsequently, the Hotel Search API is called to retrieve specific offers, including real-time prices, room availability, detailed descriptions, amenity lists, and cancellation policies for a chosen hotel.1 The final reservation is made using the Hotel Booking API.38 This modular approach allows for efficient data retrieval. Amadeus provides high-quality documentation, code samples, and an official Python SDK, significantly lowering the barrier to entry and accelerating development.3Pricing and Rate Limits: The pricing model is a key differentiator. Amadeus employs a transparent, pay-as-you-go model with a substantial free tier that is available in both the test and production environments. For instance, the Hotel Search API includes 3,000 free calls per month.2 Beyond this quota, partners pay a small fee per API call (e.g., approximately €0.0025 per Hotel Search), making costs predictable and scalable with usage.39 Production rate limits are generous, set at 40 transactions per second, which is sufficient for most high-traffic applications.40 This model is far more aligned with typical SaaS consumption than the opaque, commission-based models of the direct OTA APIs.2.2.2. Other B2B AggregatorsCompanies such as Traveltek, Trawex, and Travelport operate as B2B travel technology providers. Their core offering is the aggregation of inventory from multiple sources—including GDSs, OTAs, and specialized suppliers like Hotelbeds—into a single, unified API.41 This can save significant development effort by providing a one-stop-shop for a wide range of travel content.However, these providers generally do not offer a self-service, developer-centric onboarding process. Access to their APIs requires direct sales engagement, negotiation of commercial terms, and a formal partnership agreement. Pricing is not transparent and is typically customized for each client.41 While powerful for established travel agencies, this model is less suited for a project prioritizing agility, transparent pricing, and a swappable architectural design.2.3. Web Scraping & SERP APIs (The Gray Market)This category includes services that programmatically extract publicly available data from websites, either by scraping the sites directly or by parsing search engine results pages. This method offers the most comprehensive data but carries the highest technical and legal risks.2.3.1. SerpApi (Google Hotels)SerpApi provides a "Scraping-as-a-Service" solution that specializes in parsing search engine results. Its Google Hotels API automates the process of querying Google's hotel search interface and returns the results in a structured JSON format.4Capabilities: A single GET request to the SerpApi endpoint can retrieve a rich dataset that aggregates information from multiple OTAs as displayed on Google. The response includes hotel name, aggregated rating, number of reviews, price, amenities, and deep links to the booking pages on various travel sites.4 This provides an excellent at-a-glance market overview. The API is highly flexible, supporting extensive filtering by price, rating, and property type, as well as localization for different countries and languages.4Pricing and Legality: SerpApi operates on a monthly subscription model, with plans starting from around $75 per month for 5,000 searches.5 A notable feature is its "U.S. Legal Shield," under which SerpApi assumes legal liability for the act of scraping public data.5 While this provides a degree of protection, it is a risk-transfer mechanism, not a guarantee of full legal immunity. The end user of the data could still face legal challenges from data owners (e.g., OTAs whose data is displayed on Google) for copyright infringement or tortious interference, particularly if the data is used to create a directly competing commercial product.482.3.2. Apify (Pre-built Scrapers)Apify is a cloud platform for web scraping and automation that hosts a marketplace of "Actors," which are pre-built scrapers for popular websites. The platform features a wide variety of community- and professionally-built scrapers for major travel sites, including Booking.com and Airbnb.51Capabilities: Apify Actors are capable of extracting nearly any data point visible on a webpage, often providing more granular detail than official APIs. For example, an Airbnb scraper might extract detailed host profiles or specific review text that is not available through any official API.53 These actors are designed to handle the technical complexities of modern web scraping, including JavaScript rendering, proxy management to avoid IP blocks, and CAPTCHA solving.51Pricing and Legality: The pricing is a hybrid model, combining a monthly platform subscription (e.g., a starter plan at $39/month) with usage-based costs for compute resources, proxy traffic, and the rental fee for the specific Actor.51 The legality of using these services for commercial purposes is highly dubious. The Terms of Service for both Booking.com and Airbnb explicitly prohibit any form of automated data collection or scraping.56 While landmark legal cases like hiQ Labs, Inc. v. LinkedIn Corp. have affirmed that scraping publicly accessible data is not a violation of the Computer Fraud and Abuse Act (CFAA) in the U.S., this does not protect against other claims like breach of contract (violating the ToS), copyright infringement, or trespass to chattels. Using scraped data to power a competing commercial service is a high-risk legal strategy.482.3.3. Managed Scraping Infrastructure (Bright Data, ScraperAPI)Services like Bright Data and ScraperAPI provide the foundational infrastructure required to build and run custom web scrapers at scale. This includes large pools of residential and datacenter proxies, headless browser infrastructure for rendering JavaScript-heavy pages, and automated CAPTCHA solving systems.60These platforms offer maximum flexibility for bespoke data extraction tasks but require the most significant in-house development and ongoing maintenance effort. Pricing is typically usage-based, varying with the volume of requests and the sophistication of the features required (e.g., residential proxies are significantly more expensive than datacenter proxies).63 This approach is best suited for large-scale, non-real-time data collection for internal analytics or model training, rather than powering a live, user-facing search application where reliability and low latency are paramount.2.4. Top 3 Accommodation Data Sources: Comparative AnalysisThe following table summarizes the pros and cons of the top three recommended accommodation data sources, providing a clear basis for strategic decision-making.FeatureAmadeus Self-Service APISerpApi (Google Hotels)Booking.com Demand APISource TypeGDS APISERP API (Scraping-as-a-Service)Direct OTA APIPros• Direct access to comprehensive global GDS inventory.1• Transparent pay-as-you-go pricing with a generous free tier.2• Legally sound for commercial use and redistribution.65• Excellent documentation and official Python SDK.3• Provides an aggregated view of prices from multiple OTAs.4• Simple, easy-to-use API with rich JSON output.45• Subscription pricing is predictable.47• "Legal Shield" transfers some scraping liability.5• Access to Booking.com's massive and highly recognized inventory.14• High consumer trust and brand recognition.• Comprehensive API covering search, booking, and post-booking management.15Cons• Data structure can be complex, requiring parsing of multiple related API responses.
• Does not include inventory from sources outside the GDS network (e.g., some vacation rentals).• Legally a gray area; use for a competing commercial service carries risk despite the legal shield.48• Data freshness is dependent on Google's crawl and SerpApi's cache.• No direct booking capability via the API.• Access requires an approved "Managed Affiliate Partner" relationship.13• Highly restrictive terms of service (no price comparison, no data forwarding).21• Complex commission-on-commission revenue model.20Best ForScalable, production-grade applications requiring a reliable and legally compliant data backbone for search and booking.MVPs and applications needing a quick, broad view of market pricing. Also useful as a supplementary data source for analytics.Applications tightly integrated with the Booking.com ecosystem, where the primary business model is driving affiliate bookings directly to their platform.Implementation (1-5)3 - Moderate1 - Very Low4 - High (due to business partnership requirements)Section 3: Transport and Arrival Data Source AnalysisThis section analyzes data sources for flights, ground transportation (rail and bus), and multi-modal route planning. The evaluation prioritizes data coverage, real-time accuracy, business model, and ease of integration.3.1. Flight Search APIsAccess to flight data is dominated by GDSs and large meta-search engines, each offering APIs with distinct capabilities and commercial models.3.1.1. Amadeus Flight Offers Search APIAs part of the Amadeus Self-Service suite, the Flight Offers Search API provides direct GDS access to a comprehensive inventory of over 400 airlines, including more than 130 low-cost carriers.6 It is designed for developers to build powerful flight search and booking applications.Capabilities: The API is robust, allowing for direct flight searches that return detailed information on pricing, flight duration, airline, layovers, and available fare families.6 A key strategic advantage is its seamless integration with the Flight Create Orders API, which enables direct booking and ticketing within the Amadeus ecosystem.2Pricing: The API follows the platform's standard pay-as-you-go model, which includes a free tier of 2,000 search calls per month.2 Crucially, Amadeus offers a powerful financial incentive: partners who use the Flight Create Orders API to make paid, uncancelled bookings receive a 90% discount on all calls to the Flight Offers Search and Flight Offers Price APIs. This dramatically reduces the cost of search for applications that successfully convert bookings, strongly encouraging developers to build their entire workflow on the Amadeus platform.23.1.2. Skyscanner Travel APIsSkyscanner is a premier flight meta-search engine, and its Travel APIs provide access to its aggregated data from over 1,300 supply partners.8 This makes it an excellent source for applications that aim to provide users with a broad comparison of available options.Capabilities: The platform offers two main APIs for flight search: the Flights Live Prices API for querying real-time prices and availability, and the Flights Indicative Prices API, which returns faster results based on cached data.8 Skyscanner is renowned for its speed and its extensive coverage, particularly of low-cost carriers that may not be present in traditional GDS inventories.7 The API is a modern RESTful service that provides responses in JSON.68Pricing and Access: Unlike a pay-per-call service, access to the Skyscanner API is contingent on an affiliate agreement, which requires an application and approval process.7 The commercial model is based on revenue sharing. Partners typically receive a 50% share of the revenue Skyscanner earns when a user clicks out from the partner's site to a travel provider. This translates to a small, variable payment per click-out, estimated to be between £0.07 and £0.30 for flights.69 This model is best suited for content-driven websites and apps that monetize through affiliate referrals.3.1.3. Kiwi.com Tequila APIThe Tequila API from Kiwi.com provides B2B access to its unique flight search capabilities. Kiwi.com is particularly known for its "virtual interlining" technology, which algorithmically combines flights from non-partner airlines to create unique and often cheaper itineraries.71Capabilities: The Tequila platform offers a suite of REST APIs for location search, various flight search types (one-way, return, multi-city, and the open-ended "NOMAD" search), and booking.71 Its primary value lies in uncovering creative flight combinations that other search engines might miss.Pricing and Limitations: The API is offered for free to registered partners.71 However, the business model may involve markups on ancillary services or slightly higher base fares compared to booking directly with an airline.75 Some sources note that the API documentation is less comprehensive than that of its competitors, potentially increasing integration complexity.753.1.4. Google Flights APIA critical finding of this research is that there is no publicly available, self-service Google Flights API for general-purpose price and availability searches. The developer documentation from Google indicates that its primary flight-related API is the Travel Impact Model API, which is designed solely for calculating carbon emissions estimates for flights and does not provide pricing or scheduling data.76 Access to the core Google Flights Search engine is a partnership program reserved for airlines and major OTAs, requiring a direct integration process and not offered as a public, self-service API.773.2. Ground Transport (Rail & Bus)The ground transport market, particularly in Europe, is characterized by a fragmented landscape of national and private operators. Aggregator APIs are therefore essential for providing comprehensive coverage.Omio API: As a leading multi-modal platform in Europe, Omio (formerly GoEuro) aggregates content from over 1,000 train, bus, and flight partners.11 Their Search API is offered through an affiliate program, allowing partners to embed search functionality and redirect users to Omio to complete the booking.11 The commercial model is performance-based, with partners earning a commission on the traffic that leads to bookings, making it an affiliate tool rather than a pure data service.79Trainline API: Trainline is a dominant player in the European rail and coach market, aggregating inventory from over 270 carriers across 45 countries.80 They offer a "Global API" to B2B partners, which is a modern RESTful API providing access to their full inventory, including real-time journey information, booking, and after-sales services like refunds and exchanges.81 Access is not self-service and requires establishing a formal partnership, with a commercial model based on commissions and/or transaction fees.80 The increasing fragmentation of European rail due to deregulation enhances the value proposition of such large-scale aggregators.Single-Provider APIs (e.g., FlixBus): For major individual operators like FlixBus, APIs are often available through third-party marketplaces like RapidAPI or as part of other aggregators' offerings.83 While useful for deep integration with a specific provider, they lack the broad coverage necessary for a comprehensive ground transport solution.3.3. Multi-Modal and Local Transit PlanningMulti-modal APIs are designed to plan complete door-to-door journeys by combining various modes of transport.Rome2rio API: Historically, Rome2rio has been a leader in this space, offering a powerful API for multi-modal planning.85 However, a pivotal finding is that their API is no longer available to new applicants. The official documentation page explicitly states they are not accepting new applications, rendering this option non-viable for the project.9 This market shift, following their acquisition by Omio, underscores the volatility of relying on single-provider solutions.88Google Maps Platform (Routes API): With the effective closure of the Rome2rio API to new partners, the Google Maps Routes API emerges as the preeminent solution for global multi-modal planning. The API's TRANSIT travel mode is highly capable, providing detailed routes for public transportation, including buses, subways, trains, and trams, integrated with walking directions to and from stops.10 The API response is rich, containing information on transit lines, vehicle types, stop locations, arrival and departure times, and, where available, fare information.10 The API also allows for user preferences, such as optimizing for fewer transfers or less walking.10 The service operates on the standard Google Maps Platform pay-as-you-go pricing model, which is transparent and includes a recurring monthly free credit.91City-Specific APIs & GTFS: For applications requiring deep, granular detail within specific metropolitan areas, the most accurate data source is the city's own open data feed, typically published in the General Transit Feed Specification (GTFS) format.92 GTFS is a global open standard used by thousands of transit agencies.92 Consuming these feeds directly (e.g., from Transport for London or New York's MTA) provides the highest fidelity data but requires significant, city-by-city engineering effort to parse, store, and maintain the data. This approach is best considered an enhancement for key markets rather than a primary strategy for broad-scale routing.3.4. Flight API Pricing ComparisonThe choice between the top two flight API contenders involves a direct trade-off between a pay-per-call model that incentivizes direct booking and a revenue-share model based on affiliate referrals.FeatureAmadeus Flight Offers Search APISkyscanner Flights Live Prices APIPricing ModelPay-per-call 39Revenue Share (Commission per click-out) 70Free Tier2,000 calls/month 2Not applicable; access requires an approved affiliate agreement.7Cost Beyond Free TierApprox. €0.0055 per call (subject to change)Approx. £0.07 - £0.30 (€0.08 - €0.35) per click-out to a partner site.70Booking ModelDirect booking and ticketing are possible via integrated Flight Create Orders API.Redirect to partner website (affiliate link) for booking. No direct booking capability.Key Incentive90% discount on search calls when generating paid bookings through the Amadeus booking API, massively reducing search costs.2Access to a vast meta-search inventory from over 1,300 suppliers, including many low-cost carriers.8Section 4: Implementation, Cost, and Compliance FrameworkThis section synthesizes the research into a practical framework for decision-making, addressing the core trade-offs between different data acquisition strategies and providing a detailed analysis of cost, technical complexity, and legal considerations.4.1. API vs. Scraping: A Strategic Decision MatrixThe choice between using an official API and a scraping-based solution is the most critical strategic decision in this project. While scraping offers unparalleled data access, its instability and legal risks make it unsuitable for core, user-facing transactional functions. Official APIs, despite their constraints, provide the reliability and legal standing necessary for a production-grade application. The following matrix details the trade-offs.Evaluation CriterionOfficial APIs (e.g., Amadeus)SERP APIs (e.g., SerpApi)Managed Scraping (e.g., Apify)Cost (Initial vs. TCO)Medium/Low. Pay-per-call model has low initial cost and predictable Total Cost of Ownership (TCO) that scales with usage.2Medium. Subscription model offers predictable costs, but can be expensive at scale.93 TCO is moderate as SerpApi handles scraper maintenance.High. TCO is high, factoring in subscription fees, proxy costs, compute units, and significant ongoing engineering effort to maintain scrapers against site changes.54Data CompletenessMedium. Provides all necessary transactional data but may omit certain fields visible on the front-end (e.g., specific review text).25High. Captures everything on the SERP, including aggregated prices and ratings from multiple sources.4Very High. Can be configured to extract any and all data visible on the target website, offering the most complete dataset possible.94Data FreshnessVery High. Provides direct, real-time access to the source inventory system (GDS or OTA).1Medium. Dependent on the freshness of Google's index and SerpApi's own caching mechanisms. Not truly real-time.High. Scrapes data live upon request, but can be slower than an API call due to page rendering and navigation.54Implementation SpeedMedium. Accelerated by official SDKs and good documentation, but data models can be complex.3Very High. Extremely simple REST API with well-structured JSON output makes for very fast integration.45Low. Requires significant development to build, test, and maintain robust custom scrapers, even with platform assistance.Long-Term StabilityVery High. Based on a formal, versioned API contract. Provider is responsible for uptime and stability.Medium. Stable as long as the underlying search engine's structure does not change dramatically. The provider (SerpApi) absorbs the maintenance burden.Very Low. Highly fragile. Any change to the target website's layout, CSS, or anti-bot measures can break the scraper, requiring immediate engineering intervention.54ScalabilityVery High. Designed for high throughput with clear rate limits and enterprise-grade infrastructure.40High. Built for scale, with high-volume plans available.93Medium. Scalability is limited by anti-scraping measures of the target site and the cost of proxies and compute resources.Legal RiskVery Low. Operates under a clear legal contract (Terms of Service) that permits the intended commercial use.65Medium. Operates in a legal gray area. While scraping public data is not inherently illegal in the US, using it for a competing commercial service invites legal challenges.48High. Direct and explicit violation of the Terms of Service of target websites like Booking.com and Airbnb, which expressly forbid scraping.564.2. Comprehensive Cost AnalysisThe data sources analyzed fall into three distinct pricing models, each with different implications for application cost and scalability.Pay-as-you-go: This model, used by Amadeus and Google Maps Platform, charges a small fee for each API call, often after a generous monthly free tier is exhausted.2 It is the most transparent and scalable model, as costs are directly proportional to usage.Subscription: This model, used by SerpApi and the Apify platform, involves a fixed monthly fee for a specified volume of requests or platform resources.47 This provides cost predictability, which is beneficial for budgeting, but can become less cost-effective at very high or very low usage levels.Commission/Revenue Share: This model is used by affiliate programs like Booking.com, Skyscanner, and Omio. There are no direct costs for API calls; instead, the partner earns a percentage of the revenue generated from successful bookings or click-outs.20 This model is advantageous for applications with low initial capital but can be less profitable and more complex to track than direct payment models.4.2.1. Estimated Cost Per Trip CalculationTo illustrate the financial implications of these models, a cost estimate for a hypothetical user journey can be calculated. This journey is defined as: 10 accommodation searches, 2 flight searches, and 5 multi-modal route plans.Scenario 1: Pay-as-you-go (Amadeus + Google Maps)Accommodation Search: 10 calls * €0.0025/call (Amadeus Hotel Search) = €0.025Flight Search: 2 calls * €0.0055/call (Amadeus Flight Offers) = €0.011Route Planning: 5 calls * $0.005/call (Google Routes API) ≈ €0.0046/call * 5 = €0.023Total Estimated Cost per Trip: €0.059Scenario 2: Subscription/Affiliate (SerpApi + Skyscanner + Google Maps)Accommodation Search: 10 calls * ($150 / 15,000 calls) (SerpApi Production Plan) = $0.10 ≈ €0.092Flight Search: 2 click-outs * €0.20/click-out (Skyscanner avg. estimate) = €0.40Route Planning: 5 calls * $0.005/call (Google Routes API) ≈ €0.023Total Estimated Cost per Trip: €0.515This comparison demonstrates that for a search-intensive application, the pay-per-call model offered by Amadeus is an order of magnitude more cost-effective than models that rely on subscriptions priced per search or affiliate click-outs. The affiliate model, in particular, becomes expensive if a large number of users perform searches without converting to a click-out, as the cost is front-loaded on the conversion event.4.3. Technical Implementation Deep-DiveThe technical effort required to integrate these services varies significantly based on authentication methods, SDK availability, and documentation quality.Authentication: Simpler services like SerpApi and Kiwi.com use a straightforward API key passed as a header or query parameter.45 Enterprise-grade platforms like Amadeus use the more secure but slightly more complex OAuth 2.0 standard, which requires a preliminary call to obtain a temporary bearer token before making data requests.35Rate Limiting: All services enforce rate limits to protect their infrastructure. A robust implementation must include error handling that specifically catches 429 Too Many Requests responses and implements a retry mechanism with exponential backoff, as explicitly recommended by providers like Booking.com.22SDKs and Documentation: The availability of an official, well-maintained Software Development Kit (SDK) can dramatically reduce implementation time. The Amadeus for Developers Python SDK is a significant advantage, handling authentication and request logic transparently.3 The documentation for Amadeus, SerpApi, and Google Maps is excellent and developer-friendly. In contrast, the documentation for some other services was noted as being more limited.754.3.1. Implementation Complexity RankingProvider / ServiceComplexity (1-5)AuthenticationPython SDKDocumentation QualityKey ChallengeAmadeus API Suite3 - ModerateOAuth 2.0Official, robustExcellentHandling the complex, multi-layered GDS data model.SerpApi1 - Very LowAPI KeyThird-party/SimpleExcellentManaging legal/business risk associated with using scraped data.Skyscanner API2 - LowAPI KeyThird-party/SimpleGoodIntegration is based on an affiliate model (redirects), not direct data use.Google Maps Routes API2 - LowAPI KeyOfficial, robustExcellentUnderstanding the nuanced pricing SKUs for different request types.Apify Scrapers5 - Very HighAPI KeyOfficial (Platform)GoodBuilding and maintaining fragile scrapers that are prone to breaking.Section 5: Recommended Technical ArchitectureBased on the analysis, the technical architecture must prioritize flexibility, resilience, and a clear separation of concerns between stable, sanctioned data sources and more volatile, high-risk ones.5.1. The Swappable Provider Pattern in DetailThe proposed architecture, centered on an Abstract Base Class (ABC) for each data type, is not merely a matter of good software design; it is a strategic imperative. The travel data industry is dynamic, with providers frequently changing their terms (e.g., Booking.com's affiliate rules), discontinuing APIs (e.g., Airbnb's public API), or closing access to new partners (e.g., Rome2rio).9 A swappable provider pattern ensures the application is not tightly coupled to any single data source, allowing for agility in responding to these market shifts.The core of this pattern involves defining a standardized data contract (e.g., a Hotel data class) and an abstract interface (AccommodationProvider) that all concrete provider implementations must adhere to. This decouples the main application logic from the specifics of any one API.5.1.1. Python Code ExamplesThe following Python code illustrates the implementation of this pattern for accommodation providers.Pythonfrom abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional, Dict

# 1. Define a standardized data contract for a Hotel
@dataclass
class Hotel:
    provider_id: str
    provider: str
    name: str
    latitude: float
    longitude: float
    price: float
    currency: str
    rating: Optional[float]
    review_count: Optional[int]
    photo_url: Optional[str]
    amenities: List[str]
    cancellation_policy: Optional[str]
    raw_data: Dict # Store the original provider response for debugging

# 2. Define the Abstract Base Class for any accommodation provider
class AccommodationProvider(ABC):
    """
    Abstract interface for an accommodation data source.
    All concrete provider implementations must adhere to this contract.
    """
    @abstractmethod
    async def search(
        self,
        destination: str,
        checkin_date: str,
        checkout_date: str,
        num_guests: int
    ) -> List[Hotel]:
        """
        Searches for hotels and returns a list of standardized Hotel objects.
        """
        pass

# 3. Skeleton implementation for the recommended primary provider: Amadeus
class AmadeusAPIProvider(AccommodationProvider):
    """
    Concrete implementation for the Amadeus Self-Service Hotel Search API.
    Handles OAuth 2.0 authentication and parsing of the GDS data structure.
    """
    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret
        # In a real implementation, this would use the Amadeus Python SDK
        # from amadeus import Client
        # self.amadeus_client = Client(client_id=client_id, client_secret=client_secret)

    async def search(
        self,
        destination: str,
        checkin_date: str,
        checkout_date: str,
        num_guests: int
    ) -> List[Hotel]:
        print("Searching with Amadeus provider...")
        # Step 1: Use Amadeus SDK/client to get hotel IDs for the destination
        # e.g., response = self.amadeus_client.reference_data.locations.hotels.by_city.get(cityCode=destination)
        # hotel_ids = [h['hotelId'] for h in response.data]

        # Step 2: Call the Hotel Search API with the list of hotel IDs
        # See: /v3/shopping/hotel-offers [17]
        # e.g., offers_response = self.amadeus_client.shopping.hotel_offers_search.get(
        #     hotelIds=hotel_ids,
        #     checkInDate=checkin_date,
        #    ...
        # )

        # Step 3: Parse the complex Amadeus response into the standardized Hotel dataclass
        # This is the most complex part, mapping fields like 'offers.price.total'
        # to Hotel.price, and extracting amenities, policies, etc.
        
        # Placeholder return
        return

# 4. Skeleton implementation for the recommended secondary provider: SerpApi
class SerpApiProvider(AccommodationProvider):
    """
    Concrete implementation for SerpApi's Google Hotels API.
    Handles simple API key authentication and parsing of the SERP JSON.
    """
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://serpapi.com/search"

    async def search(
        self,
        destination: str,
        checkin_date: str,
        checkout_date: str,
        num_guests: int
    ) -> List[Hotel]:
        print("Searching with SerpApi provider...")
        params = {
            "engine": "google_hotels",
            "api_key": self.api_key,
            "q": destination,
            "check_in_date": checkin_date,
            "check_out_date": checkout_date,
            "adults": num_guests,
        }
        # In a real implementation, use an async HTTP client like aiohttp
        # async with aiohttp.ClientSession() as session:
        #     async with session.get(self.base_url, params=params) as response:
        #         data = await response.json()
        
        # Parse the relatively simple SerpApi JSON response into the Hotel dataclass
        # e.g., for hotel_data in data.get("properties",):
        #     hotels.append(Hotel(name=hotel_data.get("name"),...))

        # Placeholder return
        return

# Similar abstract classes would be created for FlightProvider and RouteProvider.
5.2. Phased Implementation RoadmapA phased approach to implementation is recommended to manage complexity, control costs, and align technical development with business milestones.Phase 1: MVP Development and Testing:Objective: Build and test the core search functionality against live data at minimal cost.Actions:Accommodation: Integrate with the Amadeus Self-Service API. Utilize the free tier in both the test (static data) and production (live data) environments. The 3,000 free monthly calls to the Hotel Search API are sufficient for all development and initial testing needs.2Flights: Integrate with the Amadeus Flight Offers Search API, leveraging its 2,000 free monthly calls.2Routing: Integrate with the Google Maps Routes API, staying within the recurring monthly free credit provided by the platform.Outcome: A functional MVP built on the final, production-intent APIs, allowing for early user feedback without incurring significant data costs.Phase 2: Production Launch and Scaling:Objective: Launch the application to the public and scale the infrastructure to handle growing user traffic.Actions: Since the application is already built on the production APIs from Amadeus and Google, this phase is primarily about monitoring and cost management. As usage exceeds the free tiers, costs will scale predictably based on the pay-as-you-go models. Implement robust monitoring of API usage and costs.Outcome: A scalable production application with a transparent and predictable cost structure.Phase 3: Optimization and Data Enrichment:Objective: Enhance the application with richer data and explore alternative data sources for cost optimization or feature enhancement.Actions:Consider integrating SerpApi's Google Hotels API as a secondary, supplementary data source. Its primary use case would be for asynchronous, background tasks, such as running daily jobs to collect market-wide pricing data for internal analytics and trend analysis. This keeps the legally higher-risk activity separate from the core, real-time user transaction path.For key metropolitan markets, investigate and integrate city-specific GTFS feeds to provide a more granular and accurate local public transit experience than the already-strong Google Maps data.Outcome: An enriched application that leverages the best of both worlds: the stability and legality of official APIs for core functions, and the data completeness of scraping for non-critical, value-add features.Section 6: Appendix: Key Resources and DocumentationThe following is a curated list of links to the official documentation, pricing pages, and developer resources for the primary recommended services.Amadeus for DevelopersMain Portal: https://developers.amadeus.com/ 6Self-Service Pricing: https://developers.amadeus.com/pricing 2Hotel Search API Documentation: https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-search 1Python SDK Guide: https://developers.amadeus.com/blog/amadues-api-django-python-sdk 3SerpApiGoogle Hotels API Documentation: https://serpapi.com/google-hotels-api 4Pricing Page: https://serpapi.com/pricing 47SkyscannerTravel APIs Documentation: https://developers.skyscanner.net/docs/intro 8Google Maps PlatformRoutes API Documentation (Transit): https://developers.google.com/maps/documentation/routes/transit-route 10Pricing Information: https://mapsplatform.google.com/pricing/ 91Multi-Modal Ground TransportOmio Affiliate Programme: https://www.omio.com/affiliate 11Trainline Partner Solutions: https://tps.thetrainline.com/ 96Legal and Compliance DocumentsBooking.com Terms and Conditions (prohibiting scraping): https://www.booking.com/content/terms.html 56Airbnb Terms of Service (prohibiting scraping): https://www.airbnb.com/help/article/2908 57Expedia Group Partner Terms of Use (prohibiting scraping): https://partner.expediagroup.com/en-us/partner-support/website-terms-of-use 97








secondary report from another research agent
I'll now compile all the research findings into a comprehensive report covering accommodation and transport data sources for Phase 2.3.

# Research Report: Accommodation & Transport Agents - Data Sources and Implementation Strategy

## Executive Summary

This comprehensive research covers accommodation APIs, flight search services, multi-modal transport solutions, and web scraping alternatives for building a travel planning application. The research reveals a fragmented landscape where official APIs require partnerships or approval, while scraping solutions offer immediate access at varying legal and technical complexities.

**Key Findings:**
- **Official hotel APIs** require partnership approval (Expedia, Agoda) or have moderate entry barriers (Amadeus)
- **Flight APIs** offer free tiers but published rates are typically higher than direct bookings
- **Scraping solutions** provide immediate access but require proxy infrastructure ($100-500/month at scale)
- **Multi-modal transport APIs** have limited public access (Rome2rio not accepting applications, Omio requires partnership)

---

## Part 1: Accommodation Data Sources

### 1.1 Official Hotel APIs (Preferred)

#### **Amadeus Self-Service Hotel API** ⭐ Recommended for MVP

**Overview:**
- Access to 150,000+ hotels globally[1][2][3]
- Two tiers: Self-Service APIs (developer-friendly) and Enterprise APIs (high-volume)[1]

**Key Features:**
- Real-time availability and pricing[4][1]
- Rich content: photos, amenities, reviews[4]
- Multi-language and multi-currency support[1]
- Advanced search with customizable filters[1]

**Pricing Model:**[5]
- **Free Tier:** Test environment with free quota each month
- **Production:** Pay-as-you-go based on usage
- No published pricing - contact required for volume estimates
- Generally competitive for startups transitioning from test to production[6][7]

**Pros:**
- Excellent documentation and developer portal[2][8]
- Self-service onboarding without approval delays
- Includes flight, car rental integration potential
- 24/7 support and high reliability[9]

**Cons:**
- Published GDS rates ~6x higher than airline direct bookings (similar issue may apply to hotels)[6]
- Limited negotiated rates compared to large OTAs[7][6]
- Rate limits may affect high-volume scraping[7]

**Implementation:**
```python
# Amadeus Hotel Search Example
import requests

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
}

params = {
    'cityCode': 'NYC',
    'checkInDate': '2025-11-01',
    'checkOutDate': '2025-11-05',
    'adults': 2
}

response = requests.get(
    'https://api.amadeus.com/v3/shopping/hotel-offers',
    headers=headers,
    params=params
)
```

***

#### **Expedia Rapid API**

**Overview:**
- 700,000+ properties including hotels, vacation rentals, treehouses[10][4]
- 24M+ property images and 100M+ verified reviews[4]

**Key Features:**
- Modular design - plug in only needed endpoints[4]
- Instant booking capabilities[4]
- Rich media content for engagement[4]

**Access Requirements:**
- **Partnership approval required**[4]
- Application review process
- Revenue-share or commission-based pricing[9][4]

**Pros:**
- Massive inventory breadth[4]
- High-quality content (images, reviews)[4]
- Trusted brand recognition

**Cons:**
- **Not accessible without approval**[4]
- Approval criteria unclear for small startups
- May require demonstrating existing traffic/revenue

***

#### **Agoda Partner API**

**Overview:**
- OAuth 2.0 authentication[11]
- REST and XML-based endpoints[12]

**Access Requirements:**
- Apply through **Agoda Affiliate Program** or **Partnership Program**[12]
- Approval + certification process required[13][12]
- Sandbox environment for testing before production[12]

**Key Features:**
- Hotel search, booking, cancellation[14][12]
- Content management for descriptions, images, amenities[12]
- Real-time rate checks[12]

**Pros:**
- Strong Asia-Pacific coverage[9]
- Clean API design[14]

**Cons:**
- **Partnership approval barrier**[11][12]
- Limited public documentation
- Unknown pricing structure

***

### 1.2 Hotel API Aggregators

#### **RapidAPI Hotel Marketplace**

**Overview:**
- Central hub connecting multiple hotel API providers[15][16][17]
- Pay-per-use model through single RapidAPI account

**Available Providers:**
- Booking.com scrapers[16]
- Hotels.com providers[18]
- MakCorps Hotel Price Comparison[16]

**Pricing:**
- Varies by provider
- MakCorps: $350-500/month for standard plans[19]
- Typically usage-based billing through RapidAPI credits

**Pros:**
- **No partnership approval needed**[15]
- Single integration point for multiple sources
- Quick prototyping

**Cons:**
- Scraping-based providers may have reliability issues
- Data freshness depends on scraper maintenance
- Limited customer support vs official APIs

***

### 1.3 Web Scraping Solutions

#### **SerpAPI Google Hotels API** ⭐ Recommended for Price Intelligence

**Overview:**
- Scrapes Google Hotels search results[20][21][22]
- Returns structured JSON with hotel listings, prices, amenities[21][20]

**Key Features:**
- **Day-by-day pricing** for up to 365 days[23]
- Real-time pricing data[20]
- Property details, reviews, ratings, amenities[21]
- GPS coordinates included[21]

**Pricing:**[24]
- **Free Trial:** Limited requests
- **Paid Plans:** Starting at $50/month
- Pay-per-request model
- Price multiplier for advanced features (e.g., 2x price when using `load_prices_by_dates`)[23]

**Data Structure:**[21]
```json
{
  "properties": [{
    "name": "Hotel Name",
    "rate_per_night": {
      "lowest": "$150",
      "extracted_lowest": 150
    },
    "gps_coordinates": {
      "latitude": 40.7589,
      "longitude": -73.9851
    },
    "overall_rating": 4.5,
    "amenities": ["Free Wi-Fi", "Pool"]
  }]
}
```

**Pros:**
- No partnership approval needed[20]
- Aggregates prices from 200+ OTAs[20]
- Historical price data available[23]
- Python SDK available[20]

**Cons:**
- Indirect data - scraping Google's aggregation
- Dependent on Google Hotels availability in target regions
- No direct booking capability (deep links only)

***

#### **Apify Booking.com Scrapers**

**Multiple Options:**

1. **Fast Booking Scraper**[25]
   - **Pay-per-result:** $3 per 1,000 results (0.003 USD/item)
   - Up to 1,700 results free monthly on $5 free tier[25]
   - $49/month Starter plan → 17,000 results/month[25]

2. **Booking Scraper (voyager/booking-scraper)**[26][27]
   - **Pricing:** $5 per 1,000 results
   - 67 monthly users, >99% success rate[26]
   - Extracts: prices, ratings, addresses, reviews, room features[27]

3. **Booking Scraper (datawizards)**[28]
   - **Pricing:** $20/month + usage
   - Structured JSON output
   - Proxy support (residential IPs available)

**General Apify Platform Pricing:**[29]
- **Free:** $5/month credits, $0.3/compute unit
- **Starter:** $39/month + pay-as-you-go
- **Scale:** $199/month, $0.25/compute unit
- **Business:** $999/month, $0.2/compute unit

**Key Features:**
- Check-in/check-out date filtering[25]
- Property type, rating, price range filters[25]
- Maximum 1,000 results per search (Booking.com limit)[25]
- Option to exceed 1,000 with special toggle[25]

**Technical Requirements:**
- Requires check-in/check-out dates for complete pricing data[25]
- May return suggested hotels outside expected region[25]

**Pros:**
- **Immediate access without approval**[30]
- Predictable pay-per-result pricing[25]
- Maintained by Apify team (reliable updates)[26]
- Good documentation and community support[31]

**Cons:**
- **Legal gray area** - Booking.com TOS prohibits automated access[32][33]
- Requires ongoing monitoring for site structure changes[32]
- Booking.com actively implements anti-bot measures[26]

***

#### **Bright Data Web Scraper**

**Overview:**
- Enterprise-grade scraping infrastructure[34][35]
- Pre-built Booking.com and Airbnb scrapers[35][36]

**Pricing:**[36][34]
- **Web Unlocker:** $2.1 per 1,000 requests
- **Scraping Browser:** $5.88/GB
- **Residential Proxies:** $5/GB
- **Datasets (Pre-collected):** Starting at $500
- **Web Scraper API (Pay-per-record):** $0.001+ per record[35]

**Key Features:**
- Automated CAPTCHA solving[34]
- Browser fingerprinting[34]
- JavaScript rendering[34]
- 150M+ residential IPs from 195 countries[34]
- 99.9% success rates claimed[34]

**Pros:**
- **Highest success rates** in industry[37][34]
- Managed infrastructure (no proxy setup needed)[34]
- 24/7 support[35]
- Enterprise SLA options[35]

**Cons:**
- **Most expensive option** ($1.50/1K vs competitors at $0.80-4.48)[38]
- Overkill for small projects[37]
- Complex pricing model[37]

***

#### **ScraperAPI**

**Pricing:**[39]
- **Free Trial:** 5,000 API credits (7-day)
- **Hobby:** $49/month (100,000 credits)
- **Startup:** $149/month (1M credits)
- **Business:** $299/month (3M credits)
- **Enterprise:** Custom pricing (5M+ credits)

**Features:**
- JS rendering, premium residential/mobile IPs, advanced bypassing[39]
- Geotargeting (US & EU regions on lower tiers, country-level on Business+)[39]
- Analytics dashboard[39]

**Performance:**[38]
- **Average success rate:** 92.70%
- **Average response time:** 15.7s
- **Average cost per 1K requests:** $8.49

**Pros:**
- All features included in price (no surprise costs)[37]
- 7-day money-back guarantee[39]
- Good for heavy-protected sites[39]

**Cons:**
- **Slowest response times** among tested competitors (15.7s)[38]
- **Most expensive per-request cost** ($8.49/1K)[38]
- Not competitive for simple scraping tasks[38]

***

### 1.4 Legal & Compliance Considerations

#### Is Scraping Booking.com Legal?

**General Guidance:**[33][32]
- **Public data scraping is generally permissible** if:
  - No login/authentication required[32]
  - Respecting robots.txt (though not legally binding)[32]
  - Reasonable request rates[32]
  - No PII collection[32]

- **Booking.com TOS explicitly prohibits** automated access[32]
  - Not enforceable law, but creates reputational/ban risk[32]

**Risk Mitigation:**[40][32]
- Use rotating proxies (residential preferred)[32]
- Rate limiting (avoid platform strain)[40][32]
- Don't scrape login-gated content[32]
- Avoid collecting PII[32]
- Document compliance measures[32]
- Consider vendor indemnification clauses[32]

**Vendor Checklist:**[32]
- Does vendor comply with Booking.com public TOS?
- Are data sources public, non-logged, and not behind paywalls?
- Is PII being collected?
- Data Processing Agreement (DPA) in place for GDPR?
- Scraping frequency rate-limited?
- Are logs stored and auditable?
- Vendor indemnification in writing?

***

#### Airbnb API Status

**Official API:**[41][42][30]
- **Invitation-only** since 2017[43][30]
- Requires: profitable business, strong tech team, customer support capability[42]
- Unlikely approval for new small developers[30][42]

**Unofficial Alternatives:**[41][42][30]
- **Apify Airbnb Scraper:** No-code scraper for listings, reviews, prices[43][30]
- **Unofficial npm packages:** e.g., `github.com/zxol/airbnbapi`[44][41]
- Airbnb's stance: "We recommend against using any unofficial API"[41]

**Risk Assessment:**
- Airbnb **does not publicly prohibit** unofficial API usage[41]
- Gray area - proceed with caution[42]
- Some property management tools use unofficial APIs without issues[42][41]

***

### 1.5 Accommodation API Comparison Matrix

| **Provider** | **Access** | **Coverage** | **Pricing Model** | **Data Quality** | **Integration Complexity** | **Best For** |
|--------------|-----------|--------------|-------------------|-----------------|---------------------------|--------------|
| **Amadeus Hotel API** | Self-service | 150K+ hotels | Pay-as-you-go | High (GDS) | Medium | MVP, scalable apps |
| **Expedia Rapid** | Partnership | 700K+ properties | Revenue share | High | Medium | Established OTAs |
| **Agoda API** | Partnership | Strong APAC | Unknown | High | Medium | Asia-focused apps |
| **SerpAPI Google Hotels** | Immediate | Aggregated (200+ OTAs) | $50+/month | High (aggregated) | Low | Price comparison |
| **Apify Booking Scraper** | Immediate | Booking.com | $3-5/1K results | High | Low | Budget MVPs |
| **Bright Data** | Immediate | Custom | $2.1/1K req | High | Medium | Enterprise scale |
| **ScraperAPI** | Immediate | Custom | $49+/month | Medium-High | Low | Ease-of-use priority |

***

## Part 2: Flight & Arrival Data Sources

### 2.1 Flight Search APIs

#### **Amadeus Flight Offers Search API** ⭐ Recommended

**Overview:**[45][46]
- Access to 400+ airlines, 130 LCCs, 150 ancillary services[47]
- Real-time flight schedules and pricing[2]

**Key Features:**[46][45]
- Search live flight prices and availability[45]
- Filter by price, carrier, cabin class, stops[45]
- Includes CO2 footprint data[46]
- Booking flow integration with **Flight Offers Price API** for confirmation[7][46]

**Pricing:**[5]
- Free tier: Test environment with monthly quota
- Production: Pay-as-you-go
- No public pricing sheet - contact for estimates

**API Flow:**[7]
1. **Flight Offers Search:** Find bookable offers
2. **Flight Offers Price:** Confirm latest price + availability
3. **Flight Create Orders:** Complete booking

**Important Considerations:**[6][7]
- **Published rates only** (no negotiated fares)[6]
- Prices can be **6x higher** than direct airline bookings[6]
- Large OTAs negotiate better rates directly with airlines[7][6]
- Best for: content aggregation, not always cheapest option

**Pros:**
- Comprehensive global coverage[47]
- Rich travel insights (seat availability, ancillaries)[47]
- Self-service access[47]
- Excellent documentation[45]

**Cons:**
- Non-competitive pricing vs direct bookings[6]
- Complex integration for full booking flow[7]
- Rate limits may constrain high-volume searches

***

#### **Skyscanner Flight API**

**Overview:**[48][49][50][51]
- Access to 3M+ destinations, 100+ airlines[49]
- Two search modes: **Cached** (free, estimates) and **Live** (real-time)[51][48]

**Key Features:**[48][49]
- Multi-city search functionality[49]
- Filtering: price range, duration, departure/arrival times, airport distance[49]
- Flight details: dates, carriers, rates[48]

**Access Requirements:**[50][52]
- Request API key via application form[52][50]
- Approval required but generally accessible[52]

**Search Modes:**[51][48]

1. **Cached Search (Free):**[48]
   - Searches existing Skyscanner data
   - Browse Routes and Browse Quotes endpoints
   - Good for estimates

2. **Live Search:**[51][48]
   - Real-time query of airlines and booking agents
   - Create search session, poll for results
   - More complex but real-time

**Pricing:**
- **Free tier** for non-commercial/low-volume use[49]
- Scalable paid plans (pricing not publicly listed)[49]

**Pros:**
- User-friendly developer tools[49]
- Strong budget airline coverage[49]
- Free tier available[49]

**Cons:**
- Requires approval/API key[50]
- Rate limiting on free tier[50]
- Live search adds complexity[51][48]

***

#### **Kiwi.com Tequila API**

**Overview:**[53][54][55]
- B2B platform for flight, multi-city, and nomad searches[53]
- Free registration, API key-based access[54][55]

**Key Features:**[55][53]
- **Search API:** One-way and return itineraries[55]
- **Multicity API:** Sequential city itineraries[53][55]
- **NOMAD API:** Visit n cities in any order[55][53]
- **Booking API:** Price validation, availability check, booking confirmation[53][55]
- **Visa API:** Check visa requirements[55][53]

**Access:**[54][55]
- Free registration on Tequila website[54]
- Create application → get API key[54]
- Choose partnership type: **Affiliate Program** or **Book with Kiwi.com**[54]

**Recent Access Changes:**[56][57]
- **As of 2022:** No longer offering free trial access[56]
- **Requires:** $100K+/month in affiliate income for approval[57][56]
- Previously accessible for startups - now limited[56]

**Pros:**
- Comprehensive search capabilities (multi-city, nomad)[53][55]
- Clean API design with multiple endpoints[55]
- Python/Node.js SDK available[58]

**Cons:**
- **High barrier to entry** ($100K/month revenue requirement)[57][56]
- Not suitable for MVPs or early-stage startups[56]

***

### 2.2 Flight API Comparison

| **Provider** | **Access** | **Coverage** | **Pricing** | **Search Modes** | **Best For** |
|--------------|-----------|--------------|-------------|-----------------|--------------|
| **Amadeus Flight API** | Self-service | 400+ airlines | Pay-as-you-go (free tier) | Real-time | MVP, global coverage |
| **Skyscanner Flight API** | Approval required | 3M+ destinations | Free tier + paid | Cached + Live | Budget airlines, flexibility |
| **Kiwi.com Tequila API** | High barrier ($100K/mo) | Multi-modal | Unknown | Multi-city, Nomad | Established aggregators |

**Recommendation:**
- **MVP:** Amadeus Flight API (immediate access, good docs)
- **Budget focus:** Skyscanner (if approved, strong LCC coverage)
- **Advanced itineraries:** Kiwi.com (if revenue qualifies)

***

## Part 3: Multi-Modal Transport Data

### 3.1 Multi-Modal Route Planning APIs

#### **Rome2rio API**

**Status:** ❌ **NOT ACCEPTING NEW APPLICATIONS**[59]

**Historical Overview:**[60][61][62]
- Multi-modal search: flights, trains, buses, ferries, driving[63][60]
- 700+ airlines, 2M+ surface routes[62]
- Coverage: India, Europe, Egypt, China, Morocco rail[62]

**Pricing (No Longer Available):**[61][60][62]
- Previously: $1,500-3,000 for API access[62]
- Integration: $2,000-5,000 setup[62]
- Custom pricing based on volume[60][61]

**Why Unavailable:**
- "Currently not accepting new applications"[59]
- Focus on existing API partners only[59]

***

#### **Omio API**

**Status:** 🔒 **Partnership Required**[64][65][66]

**Overview:**[67][68]
- Multi-modal: trains, buses, flights, ferries[67]
- Search API connects 1,000+ partners[66]

**Access:**[69][65][66]
- **Search API** available for affiliates[66]
- Data feed with popular destinations (no approval needed)[65]
- Full API access requires **brand approval**[65]
- Contact Omio partnership team for integration[68]

**Data Feed (No Approval):**[65]
- Popular destinations by country
- Limited functionality compared to full API

**Pros:**
- Comprehensive European coverage[67]
- Multi-modal search in one API[66]

**Cons:**
- Partnership barrier for full API access[65]
- Limited public documentation
- Unknown pricing

***

### 3.2 Regional Rail APIs

#### **Trainline API**

**Status:** 🔒 **Partnership Required**[70][71][72]

**Overview:**[71][70]
- Global rail and coach content API[70]
- Used by **Amadeus** in corporate travel platform[72]

**Access:**
- Apply via Trainline Partner Solutions[71][70]
- Designed for travel sellers and enterprise clients[71]

**Pros:**
- Trusted by major travel platforms[72]
- Global rail coverage[70]

**Cons:**
- No public self-service access[70]
- Enterprise-focused (high barrier for startups)

***

#### **FlixBus API**

**Status:** 🔒 **Partnership Required**[73][74][75]

**Overview:**[74][75]
- Long-distance bus journeys across Europe[74]
- Developer portal: `developer.api.flixbus.com`[76]

**Access:**[77][73][74]
- Partnership required (no public self-service)[73]
- Users report FlixBus requires existing traffic before API access[73]
- Third-party integrations available (e.g., Lyko)[74]

**Alternative:**[75][74]
- **Lyko API:** Aggregates FlixBus + hundreds of mobility providers[74]
- Quick integration without direct FlixBus partnership[74]

**Unofficial Options:**[75]
- **RapidAPI FlixBus scrapers** available[75]
- Legal risk similar to Booking.com scraping

**Pros:**
- Strong European bus coverage[74]
- Official developer portal exists[76]

**Cons:**
- Requires existing traffic for approval[73]
- Chicken-and-egg problem for new apps[73]

***

#### **Busbud API**

**Status:** ✅ **Partnership Available**[78][79]

**Overview:**[80][78]
- Intercity bus and rail services globally[78]
- API integration + white label solution[78]

**Access:**[78]
1. Fill out **Partnership Inquiry Form**[78]
2. Discuss requirements with Busbud team[78]
3. Technical team assists with integration[78]

**Features:**[80]
- Multi-operator bus ticket booking[80]
- Real-time pricing and availability[80]
- Multi-language and multi-currency support[80]

**Pricing:**
- Revenue sharing model[78]
- Pricing not publicly disclosed

**Pros:**
- Extensive global bus inventory[80][78]
- Flexible integration (API or white label)[78]
- Dedicated support[78]

**Cons:**
- Partnership approval required[78]
- Revenue share model (reduces margins)
- Unknown minimum volume requirements

***

### 3.3 Google Maps Transit & Routes API

**Overview:**[81][82][83][84]
- Transit API for local public transport[85]
- Routes API for multi-modal directions[86]

**Pricing Changes (March 1, 2025):**[87][83][85]

**Previous Model:**[82][81]
- $200 free monthly credit
- Dynamic Maps: $7/1K requests
- Routes API: $5-10/1K requests
- Transit included in Directions API

**New Model (Effective March 1, 2025):**[85][87]
- Total $3,250 in free usage across **all products**[85]
- Allocated across Maps, Routes, Places, Environment APIs[85]
- **Directions API deprecated** → use Routes API[83]
- Potential cost increase for single-product heavy users[85]

**Example Cost Impact:**[85]
- 30,000 Dynamic Map loads: $140/month (including credit)[85]
- Heavy single-API users may see 5-7x cost increase[85]

**Key Features:**[81]
- City-level geotargeting[81]
- Real-time transit data (where available)[85]
- GTFS format support[88]

**Pros:**
- Most comprehensive mapping data[82]
- Real-time updates[81]
- City-specific transit APIs (London TfL, NYC MTA, etc.)[88]

**Cons:**
- **Significant price increase** for focused use cases[87][85]
- Complex new pricing model[87]
- Must manage budget across multiple API products[85]

***

### 3.4 Multi-Modal Transport Comparison

| **Provider** | **Access** | **Coverage** | **Data Types** | **Pricing** | **Status** |
|--------------|-----------|--------------|---------------|------------|-----------|
| **Rome2rio** | Closed | Global (700+ airlines, 2M routes) | All modes | N/A | Not accepting applications[59] |
| **Omio** | Partnership | Europe, US | Train, bus, flight, ferry | Unknown | Limited data feed available[65] |
| **Trainline** | Partnership | Global rail | Train, coach | Unknown | Enterprise-focused[70] |
| **FlixBus** | Partnership | Europe | Bus | Unknown | Requires existing traffic[73] |
| **Busbud** | Partnership | Global | Bus, rail | Revenue share | Open to new partners[78] |
| **Google Transit/Routes** | Immediate | Global | Public transit, directions | $3,250 free → usage-based | Price increase March 2025[85] |

**Recommendation:**
- **Short-term:** Google Maps Routes API (immediate access, comprehensive)
- **Long-term:** Apply for Busbud partnership (most accessible multi-modal option)
- **Alternative:** Build custom aggregation layer using regional rail APIs (SNCF, NS, National Rail)[88]

***

## Part 4: Cost Analysis & Implementation Recommendations

### 4.1 Per-Trip Cost Estimates

**Accommodation Search (1 destination, 3-day stay):**

| **Solution** | **Search Cost** | **Notes** |
|-------------|----------------|-----------|
| Amadeus Hotel API | ~$0.01-0.05 | Depends on volume tier |
| SerpAPI Google Hotels | ~$0.05 | Pay-per-request |
| Apify Booking Scraper | $0.003-0.005 | Pay-per-result |
| Bright Data | $0.0021 | Per 1K requests (Web Unlocker) |
| ScraperAPI | $0.0085 | Most expensive per-request |

**Flight Search (1 route, round-trip):**

| **Solution** | **Search Cost** | **Notes** |
|-------------|----------------|-----------|
| Amadeus Flight API | ~$0.01-0.05 | Free tier available |
| Skyscanner | Free (cached) / ~$0.02 (live) | Cached search free |
| Kiwi.com | N/A | $100K/month barrier |

**Multi-Modal Routing (1 itinerary):**

| **Solution** | **Routing Cost** | **Notes** |
|-------------|-----------------|-----------|
| Google Routes API | ~$0.005-0.01 | $5-10 per 1K requests |
| Rome2rio | N/A | Not accepting applications |
| Omio Data Feed | Free | Limited destination data only |

**Total Estimated Cost per Trip (Accommodation + Flight + Routing):**
- **Budget Setup:** $0.013-0.025 (Apify + Skyscanner cached + Google Routes)
- **Mid-Tier:** $0.05-0.10 (Amadeus both + Google Routes)
- **Premium:** $0.10-0.20 (Bright Data + Amadeus + Google Routes)

**Monthly Cost for 10,000 Trips:**
- Budget: $130-250/month
- Mid-Tier: $500-1,000/month
- Premium: $1,000-2,000/month

---

### 4.2 Infrastructure Costs (Scraping-Based Solutions)

If using web scraping solutions at scale:

**Proxy Infrastructure:**[34][32]
- Residential proxies: $5-10/GB (need ~10-50GB/month for 10K trips)[34]
- **Cost:** $50-500/month

**Headless Browser Hosting:**[32]
- Server orchestration for Playwright/Puppeteer[32]
- AWS EC2 or similar: $50-200/month

**Monitoring & Maintenance:**[32]
- QA monitoring for schema drift[32]
- Developer time: 5-10 hours/month
- **Cost:** $250-500/month (at $50/hour)

**Total Scraping Infrastructure (10K trips/month):**
- **Direct costs:** $100-700/month
- **Maintenance:** $250-500/month
- **Total:** $350-1,200/month

**Hidden Risk Costs:**
- IP bans requiring new proxies
- CAPTCHA solving services
- Legal consultation on TOS compliance
- Potential platform bans (lost development time)

***

### 4.3 Recommended Architecture Pattern

#### **Design for Swappability** ⭐

```python
from abc import ABC, abstractmethod
from typing import List
from datetime import date

class Hotel:
    """Data model for hotel results"""
    def __init__(self, name, price, rating, location, amenities):
        self.name = name
        self.price = price
        self.rating = rating
        self.location = location  # {"lat": float, "lng": float}
        self.amenities = amenities

class AccommodationProvider(ABC):
    """Abstract base class for accommodation providers"""
    
    @abstractmethod
    async def search(
        self, 
        destination: str, 
        checkin: date, 
        checkout: date, 
        guests: int
    ) -> List[Hotel]:
        """Search for hotels in destination for given dates"""
        pass
    
    @abstractmethod
    async def get_details(self, hotel_id: str) -> Hotel:
        """Get detailed information for specific hotel"""
        pass

# Initial Implementation: Booking.com Scraper
class BookingComScraper(AccommodationProvider):
    def __init__(self, apify_api_key: str):
        self.api_key = apify_api_key
    
    async def search(self, destination, checkin, checkout, guests):
        # Call Apify Booking Scraper
        # Parse results into Hotel objects
        pass
    
    async def get_details(self, hotel_id):
        # Fetch detailed hotel data
        pass

# Production Swap: Amadeus API
class AmadeusHotelProvider(AccommodationProvider):
    def __init__(self, api_key: str, api_secret: str):
        self.api_key = api_key
        self.api_secret = api_secret
    
    async def search(self, destination, checkin, checkout, guests):
        # Call Amadeus Hotel API
        # Transform to Hotel objects
        pass
    
    async def get_details(self, hotel_id):
        # Fetch from Amadeus
        pass

# Price Intelligence: SerpAPI Google Hotels
class GoogleHotelsPriceProvider(AccommodationProvider):
    def __init__(self, serpapi_key: str):
        self.api_key = serpapi_key
    
    async def search(self, destination, checkin, checkout, guests):
        # Scrape Google Hotels via SerpAPI
        # Return price comparison data
        pass

# Aggregator Layer
class AccommodationAggregator:
    def __init__(self, providers: List[AccommodationProvider]):
        self.providers = providers
    
    async def search_all(self, destination, checkin, checkout, guests):
        """Query multiple providers in parallel, deduplicate, return best deals"""
        tasks = [
            provider.search(destination, checkin, checkout, guests) 
            for provider in self.providers
        ]
        results = await asyncio.gather(*tasks)
        
        # Deduplicate by hotel name + location
        # Rank by price, rating, commute times
        return self._deduplicate_and_rank(results)
```

**Flight Provider Pattern:**

```python
class Flight:
    """Data model for flight results"""
    pass

class FlightProvider(ABC):
    @abstractmethod
    async def search(self, origin, destination, departure_date, return_date):
        pass

class AmadeusFlightProvider(FlightProvider):
    async def search(self, origin, destination, departure_date, return_date):
        # Amadeus Flight Offers Search
        pass

class SkyscannerFlightProvider(FlightProvider):
    async def search(self, origin, destination, departure_date, return_date):
        # Skyscanner cached or live search
        pass
```

**Benefits:**
- **Easy provider swapping** (scraper → official API)
- **A/B testing** different providers
- **Fallback mechanisms** if one provider fails
- **Price aggregation** from multiple sources
- **Unified data model** for frontend consumption

***

### 4.4 Implementation Complexity Ranking (1-5 scale)

| **Solution** | **Complexity** | **Reasoning** |
|-------------|---------------|---------------|
| **SerpAPI Google Hotels** | ⭐ 1/5 | Simple HTTP requests, clean JSON response |
| **Apify Booking Scraper** | ⭐⭐ 2/5 | Pre-built scraper, just configure inputs |
| **Amadeus Hotel API** | ⭐⭐⭐ 3/5 | OAuth setup, pagination, rate limits |
| **Skyscanner Flight API** | ⭐⭐⭐ 3/5 | Session-based live search adds complexity |
| **Custom Booking Scraper** | ⭐⭐⭐⭐⭐ 5/5 | Playwright, proxies, CAPTCHA, maintenance |
| **Bright Data** | ⭐⭐⭐ 3/5 | Managed infrastructure, but complex pricing |
| **Multi-Provider Aggregation** | ⭐⭐⭐⭐ 4/5 | Deduplication, ranking, parallel queries |

---

## Part 5: Decision Matrix & Final Recommendations

### 5.1 Scraping vs API Decision Matrix

| **Criterion** | **Scraping Solutions** | **Official APIs** |
|--------------|----------------------|------------------|
| **Time to Production** | ⭐⭐⭐⭐⭐ Hours | ⭐⭐⭐ Days-Weeks (approval delays) |
| **Legal Risk** | ⚠️ Medium-High (TOS violations) | ✅ Low (licensed access) |
| **Data Freshness** | ⭐⭐⭐⭐ High (real-time scraping) | ⭐⭐⭐⭐⭐ Real-time (official feeds) |
| **Maintenance Burden** | ⚠️ High (site changes, anti-bot) | ✅ Low (vendor manages) |
| **Cost (10K trips/month)** | $350-1,200/month | $500-2,000/month |
| **Scalability** | ⚠️ Limited by proxies, CAPTCHAs | ✅ High (designed for scale) |
| **Data Quality** | ⭐⭐⭐⭐ High (scraping real data) | ⭐⭐⭐⭐⭐ Highest (official data) |
| **Booking Integration** | ❌ No (deep links only) | ✅ Yes (full booking flow) |
| **Support** | ⚠️ Community/vendor-dependent | ✅ 24/7 vendor support |

**When to Choose Scraping:**
- **Early MVP** (need fast validation)
- **Price intelligence** (need comparison across OTAs)
- **No booking requirement** (search/display only)
- **Budget-constrained** (<$500/month)

**When to Choose Official APIs:**
- **Production application** (need stability)
- **Booking integration** (end-to-end transactions)
- **Compliance requirements** (legal/enterprise)
- **Scale expectations** (>10K trips/month)

---

### 5.2 Recommended Phased Approach

#### **Phase 1: MVP (Month 1-2)**
**Goal:** Validate product-market fit with minimal cost

**Accommodation:**
- **Primary:** Apify Fast Booking Scraper ($49/month Starter → 17K results)[25]
- **Backup:** SerpAPI Google Hotels ($50/month)

**Flights:**
- **Primary:** Skyscanner Cached Search (Free)[48]
- **Backup:** Amadeus Free Tier (test environment)

**Local Transport:**
- **Primary:** Google Maps Routes API ($200 free credit)[84]

**Pros:**
- Total cost: ~$100-150/month
- No approval delays
- Fast iteration

**Cons:**
- Legal gray area (scraping)
- No booking integration
- Limited scalability

**Timeline:** 1-2 weeks integration

***

#### **Phase 2: Production Beta (Month 3-6)**
**Goal:** Migrate to stable APIs, add booking

**Accommodation:**
- **Primary:** Amadeus Hotel API (self-service)
- **Price Intelligence:** Keep SerpAPI for comparison

**Flights:**
- **Primary:** Amadeus Flight API (pay-as-you-go)
- **Secondary:** Skyscanner Live Search (if approved)

**Multi-Modal:**
- **Primary:** Google Routes API
- **Apply for:** Busbud partnership (bus/rail)

**Pros:**
- Legal compliance
- Official data sources
- Booking integration ready
- Vendor support

**Cons:**
- Higher cost (~$500-1,000/month at 10K trips)
- Integration complexity
- Potentially non-competitive pricing

**Timeline:** 4-6 weeks migration + testing

***

#### **Phase 3: Scale (Month 6+)**
**Goal:** Optimize costs, negotiate volume rates

**Accommodation:**
- Negotiate enterprise pricing with Amadeus
- Apply for Expedia Rapid API partnership
- Keep SerpAPI for price comparison

**Flights:**
- Continue Amadeus
- Explore direct LCC connections for better rates

**Multi-Modal:**
- Busbud partnership finalized
- Consider Rome2rio alternatives (if they reopen)
- Regional rail APIs (SNCF, NS, National Rail)[88]

**Pros:**
- Volume discounts
- Multiple provider redundancy
- Comprehensive coverage

**Cons:**
- Complex multi-provider management
- Higher fixed costs

***

### 5.3 Top 3 Accommodation Solutions with Pros/Cons

| **Rank** | **Provider** | **Pros** | **Cons** | **Best For** |
|---------|-------------|----------|----------|-------------|
| **1** | **Amadeus Hotel API** | ✅ 150K+ hotels<br>✅ Self-service access<br>✅ Excellent docs<br>✅ Scalable<br>✅ Booking integration | ⚠️ Published GDS rates (not cheapest)<br>⚠️ Moderate cost<br>⚠️ Rate limits | Production apps, global coverage, long-term reliability |
| **2** | **SerpAPI Google Hotels** | ✅ No approval needed<br>✅ Aggregates 200+ OTAs<br>✅ Historical pricing data<br>✅ Simple integration<br>✅ Low cost | ⚠️ No direct booking<br>⚠️ Dependent on Google Hotels<br>⚠️ Deep links only | Price comparison, MVP, market research |
| **3** | **Apify Booking Scraper** | ✅ Immediate access<br>✅ Low cost ($3/1K results)<br>✅ Pay-per-result<br>✅ Maintained by Apify | ⚠️ Legal gray area<br>⚠️ TOS violations<br>⚠️ Site changes break scraper<br>⚠️ No booking API | Budget MVPs, short-term validation, backup data source |

***

### 5.4 Top 2 Flight APIs with Pricing Comparison

| **Rank** | **Provider** | **Pricing** | **Pros** | **Cons** | **Best For** |
|---------|-------------|------------|----------|----------|-------------|
| **1** | **Amadeus Flight Offers Search** | **Free tier:** Test environment quota<br>**Production:** Pay-as-you-go (contact for rates) | ✅ 400+ airlines<br>✅ Self-service<br>✅ Comprehensive docs<br>✅ Booking integration | ⚠️ Published rates (6x higher than direct)<br>⚠️ Complex booking flow | Production apps, global coverage, comprehensive search |
| **2** | **Skyscanner Flight API** | **Free tier:** Cached search<br>**Paid:** Contact for live search pricing | ✅ Strong LCC coverage<br>✅ Cached search free<br>✅ User-friendly<br>✅ Multi-city support | ⚠️ Requires approval<br>⚠️ Live search complex<br>⚠️ Rate limits on free tier | Budget airlines, flexible search, MVP |

**Cost Comparison (10K flight searches/month):**
- **Amadeus:** ~$100-500 (estimated based on volume tier)
- **Skyscanner:** Free (cached) or ~$200-400 (live, estimated)

***

### 5.5 Best Multi-Modal Transport API Recommendation

**Winner:** 🏆 **Google Maps Routes API** (with Busbud partnership as secondary)

**Reasoning:**
- **Immediate access** (no partnership approval)[84]
- **Comprehensive coverage** (global public transit data)[81]
- **Reliable infrastructure** (Google-scale reliability)[82]
- **Developer-friendly** (extensive documentation)[84]

**Caveats:**
- **Price increase March 2025** ($3,250 free credit split across all Google Maps products)[87][85]
- **Not ideal for heavy single-API users** (cost can spike)[85]
- **Limited inter-city bus/train** (better for local transit)

**Complementary Strategy:**
1. **Primary:** Google Routes API for directions + local transit
2. **Secondary:** Apply for **Busbud partnership** for inter-city bus/rail[78]
3. **Long-term:** Regional rail APIs (SNCF, NS, National Rail) for specific markets[88]

**Alternative (if Google pricing unacceptable):**
- Build custom aggregator using:
  - **Busbud API** (bus/rail)
  - **Regional rail APIs** (SNCF for France, NS for Netherlands, etc.)[88]
  - **Open GTFS feeds** (local transit)[88]
  - **Amadeus Flight API** (flights)

***

## Part 6: Code Examples & Implementation Resources

### 6.1 Amadeus Hotel Search (Python)

```python
import requests
import json

# Step 1: Get Access Token
auth_url = "https://test.api.amadeus.com/v1/security/oauth2/token"
auth_data = {
    "grant_type": "client_credentials",
    "client_id": "YOUR_API_KEY",
    "client_secret": "YOUR_API_SECRET"
}

auth_response = requests.post(auth_url, data=auth_data)
access_token = auth_response.json()["access_token"]

# Step 2: Search Hotels
search_url = "https://test.api.amadeus.com/v3/shopping/hotel-offers"
headers = {
    "Authorization": f"Bearer {access_token}"
}
params = {
    "cityCode": "NYC",
    "checkInDate": "2025-11-01",
    "checkOutDate": "2025-11-05",
    "adults": 2,
    "radius": 10,
    "radiusUnit": "KM",
    "ratings": "4,5",
    "currency": "USD"
}

response = requests.get(search_url, headers=headers, params=params)
hotels = response.json()

# Step 3: Parse Results
for offer in hotels.get("data", []):
    hotel = offer["hotel"]
    price = offer["offers"][0]["price"]
    
    print(f"Hotel: {hotel['name']}")
    print(f"Price: {price['total']} {price['currency']}")
    print(f"Rating: {hotel.get('rating', 'N/A')}")
    print("---")
```

**Documentation:** https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-search[2][45]

---

### 6.2 SerpAPI Google Hotels (Python)

```python
import requests

SERPAPI_API_KEY = "YOUR_SERPAPI_KEY"

params = {
    "api_key": SERPAPI_API_KEY,
    "engine": "google_hotels",
    "q": "New York",
    "check_in_date": "2025-11-01",
    "check_out_date": "2025-11-05",
    "adults": 2,
    "currency": "USD"
}

response = requests.get("https://serpapi.com/search", params=params)
data = response.json()

# Parse hotel results
for hotel in data.get("properties", []):
    print(f"Hotel: {hotel['name']}")
    print(f"Price per night: {hotel['rate_per_night']['lowest']}")
    print(f"Rating: {hotel.get('overall_rating', 'N/A')}")
    print(f"Location: {hotel['gps_coordinates']}")
    print("---")
```

**Documentation:** https://serpapi.com/google-hotels-api[22]

***

### 6.3 Apify Booking Scraper (Python)

```python
from apify_client import ApifyClient

client = ApifyClient("YOUR_APIFY_TOKEN")

# Prepare input for the Actor
run_input = {
    "search": "New York",
    "destType": "city",
    "checkIn": "2025-11-01",
    "checkOut": "2025-11-05",
    "rooms": 1,
    "adults": 2,
    "children": 0,
    "currency": "USD",
    "language": "en-us",
    "propertyType": "hotel",
    "minMaxPrice": "0-500",
    "maxItems": 50
}

# Run the Actor
run = client.actor("voyager/booking-scraper").call(run_input=run_input)

# Fetch results
for item in client.dataset(run["defaultDatasetId"]).iterate_items():
    print(f"Hotel: {item['name']}")
    print(f"Price: {item['price']}")
    print(f"Rating: {item['rating']}")
    print(f"URL: {item['url']}")
    print("---")
```

**Documentation:** https://apify.com/voyager/booking-scraper[27]

***

### 6.4 Abstract Provider Pattern (Full Example)

See **Section 4.3** above for complete swappable architecture pattern.

***

## Part 7: Final Deliverables Summary

### 7.1 Top Accommodation Data Sources

| **Rank** | **Provider** | **Type** | **Pros** | **Cons** | **Cost/10K trips** |
|---------|-------------|----------|----------|----------|-------------------|
| 1 | Amadeus Hotel API | Official API | Self-service, scalable, booking ready | Published rates, moderate cost | $100-500 |
| 2 | SerpAPI Google Hotels | Scraper (legal) | Aggregates 200+ OTAs, simple | No booking, deep links only | $50-100 |
| 3 | Apify Booking Scraper | Scraper (gray area) | Low cost, immediate access | TOS violations, maintenance | $30-50 |

***

### 7.2 Top Flight APIs

| **Rank** | **Provider** | **Pros** | **Cons** | **Cost/10K searches** |
|---------|-------------|----------|----------|--------------------|
| 1 | Amadeus Flight API | Comprehensive, self-service, docs | Published rates (expensive) | $100-500 |
| 2 | Skyscanner Flight API | Strong LCC coverage, free cached | Requires approval, rate limits | Free-$400 |

***

### 7.3 Best Multi-Modal API

**Winner:** Google Maps Routes API
- **Cost:** $200 free → $5-10/1K requests (price increase March 2025)
- **Backup:** Busbud partnership (apply now, 4-8 week approval)

***

### 7.4 Scraping vs API Decision

| **Criterion** | **Scraping** | **Official API** | **Winner** |
|--------------|-------------|-----------------|-----------|
| Speed to MVP | Hours | Days-Weeks | Scraping |
| Legal Compliance | ⚠️ Gray area | ✅ Compliant | API |
| Maintenance | High | Low | API |
| Cost (10K trips) | $350-1,200 | $500-2,000 | Scraping |
| Scalability | Limited | High | API |
| Booking Integration | ❌ No | ✅ Yes | API |

**Recommendation:**
- **MVP:** Start with scraping (Apify + SerpAPI)
- **Production:** Migrate to Amadeus APIs
- **Long-term:** Hybrid (Amadeus + SerpAPI price intelligence)

***

### 7.5 Implementation Complexity

| **Task** | **Complexity** | **Timeline** |
|---------|---------------|--------------|
| SerpAPI integration | ⭐ 1/5 | 1-2 days |
| Apify integration | ⭐⭐ 2/5 | 2-3 days |
| Amadeus Hotel API | ⭐⭐⭐ 3/5 | 1 week |
| Skyscanner Flight API | ⭐⭐⭐ 3/5 | 1 week |
| Custom scraper | ⭐⭐⭐⭐⭐ 5/5 | 2-4 weeks |
| Multi-provider aggregation | ⭐⭐⭐⭐ 4/5 | 2-3 weeks |

***

### 7.6 Total Cost Estimate (10K trips/month)

**Budget Setup:**
- Accommodation: Apify ($49) + SerpAPI ($50) = $99
- Flights: Skyscanner cached (free)
- Routes: Google Maps ($50-100)
- **Total: $150-200/month**

**Production Setup:**
- Accommodation: Amadeus ($200-400)
- Flights: Amadeus ($100-300)
- Routes: Google Maps + Busbud ($100-200)
- **Total: $400-900/month**

**Enterprise Setup:**
- Accommodation: Amadeus + Expedia Rapid ($500-1,000)
- Flights: Amadeus + Direct LCC ($300-600)
- Routes: Busbud + Regional APIs ($200-400)
- **Total: $1,000-2,000/month**

***

### 7.7 Key Takeaways

1. **No silver bullet:** Every solution has trade-offs (cost vs compliance vs coverage)

2. **Phased approach recommended:** Start scraping → migrate to APIs → optimize with partnerships

3. **Amadeus is the safe bet:** Best balance of accessibility, documentation, and coverage for both hotels and flights

4. **Scraping is viable for MVPs:** Use Apify + SerpAPI for fast validation, but plan migration path

5. **Multi-modal is fragmented:** Google Routes API + Busbud is best hybrid solution

6. **Design for swappability:** Abstract provider pattern enables testing multiple sources and easy migrations

7. **Budget for infrastructure:** Scraping requires $350-1,200/month in proxies, hosting, maintenance

8. **Legal gray areas exist:** Scraping Booking.com violates TOS but is common practice - assess risk tolerance

9. **Partnership APIs offer best rates:** Expedia, Agoda, Trainline require approval but worth pursuing long-term

10. **Price intelligence layer:** Keep SerpAPI even in production for competitive price monitoring
