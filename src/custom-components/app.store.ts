import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { computed, inject, InjectionToken } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { getState, patchState, signalStore, signalStoreFeature, withComputed, withMethods, withState } from '@ngrx/signals';
import { catchError, firstValueFrom, map } from 'rxjs';

import { Aggregation, CCApp, CCColumn, CCQuery, CCWebService, EngineType } from '@sinequa/atomic';
import { AggregationsStore, AppService, CFilter, CFilterItem, CJsonMint, CSources, SideCJson } from '@sinequa/atomic-angular';

/**
 * Injection token for a list of facet names to display in the application.
 *
 * This token provides a default list of facet names including:
 * - Geo
 * - Company
 * - Person
 * - DocFormat
 * - Modified
 * - Size
 * - DocumentLanguages
 * - Concepts
 *
 * @constant
 * @type {InjectionToken<string[]>}
 */
export const AGGREGATIONS_NAMES_PRESET_DEFAULT = [
  'Places',
  'Sources',
  'Company',
  'People',
  'Formats',
  'Modified',
  'Dates',
  'Sizes',
  'Languages',
  'Concepts',
  'DocFormat',
  'Geo',
  'Person',
  'Treepath',
  'DocumentLanguages',
  'Size'
];

export const AGGREGATIONS_NAMES = new InjectionToken('Facets list to display', { factory: () => AGGREGATIONS_NAMES_PRESET_DEFAULT });

export type CCWebServiceLabels = CCWebService & {
  privateLabelsField: string;
  publicLabelsField: string;
};

export type CCAppState = {
  data: CJsonMint;
  customJSONs: SideCJson[];
  webServices: Record<string, CCWebService>;
  queries: Record<string, CCQuery>;
};

export const AppStore = signalStore(
  { providedIn: 'root' },
  withDevtools('App'),

  withAppFeatures(),
  withAppCustomizationFeatures()
);

/**
 * Basic app management features
 */
export function withAppFeatures() {
  return signalStoreFeature(
    withState({ webServices: {}, queries: {} }),
    /**
     * Enhances the application store with various features and methods.
     *
     * This function integrates state management, computed properties, and methods
     * to interact with the CCApp state, including initialization, updates,
     * and retrieval of specific data such as web services, queries, and customization JSONs.
     *
     * Features:
     * - State management with initial data.
     * - Computed properties for customization JSON, sources, and filters.
     * - Methods for initializing and updating the application state.
     * - Methods for retrieving web services, labels, queries, and customization JSONs.
     * - Methods for retrieving aggregation icons and customization items.
     *
     * @returns The enhanced application store with additional features and methods.
     */
    withMethods((store, appService = inject(AppService)) => ({
      /**
       * Initializes the application state by fetching the app data from the appService
       * and updating the store with the retrieved data.
       *
       * @returns A promise that resolves when the app data has been fetched and the store has been updated.
       */
      initialize() {
        return firstValueFrom(
          appService.getApp().pipe(
            catchError(error => {
              console.error('Error fetching app data:', error);
              throw error;
            }),
            map(app => patchState(store, app))
          )
        );
      },
      /**
       * Initializes the application state with the provided app name.
       *
       * @param appName - The name of the application to fetch the configuration for.
       *
       * @returns A promise that resolves when the app data has been fetched and the store has been updated.
       */
      initializeWithAppName(appName: string) {
        return firstValueFrom(appService.getApp(appName).pipe(map(app => patchState(store, app))));
      },
      /**
       * Updates the application state with the provided CCApp object.
       *
       * @param {CCApp} app - The application object containing the new state values.
       */
      update(app: CCApp) {
        patchState(store, state => {
          return { ...state, ...app };
        });
      },
      /**
       * Returns the web service by type name
       *
       * @param type Web service type name
       * @returns A {@link CCWebService} object or undefined if not found
       */
      getWebServiceByType(type: CCWebService['webServiceType']): CCWebService | undefined {
        let webService = undefined;

        Object.keys(store.webServices()).forEach(key => {
          const w = store.webServices() as Record<string, CCWebService>;
          const ws = w[key] as unknown as CCWebService;
          // Check if the web service type matches the specified type in lowercase
          if (ws.webServiceType.toLowerCase() === type.toLocaleLowerCase()) webService = ws;
        });

        return webService;
      },
      /**
       * Retrieves the labels from the web service of type 'Labels'.
       *
       * @returns An object containing the private and public labels.
       *          If the labels are not found, returns an object with empty strings for both fields.
       */
      getLabels(): { private: string; public: string } {
        const labels = this.getWebServiceByType('labels') as CCWebServiceLabels;
        if (!labels) return { private: '', public: '' };
        const { publicLabelsField, privateLabelsField } = labels;
        return { private: privateLabelsField, public: publicLabelsField };
      },
      /**
       * Retrieves a query by its name from the store.
       *
       * @param name - The name of the query to retrieve.
       * @returns The query object if found, otherwise `undefined`.
       */
      getQueryByName(name: string): CCQuery | undefined {
        const queries = store.queries() as Record<string, CCQuery>;
        return queries[name.toLowerCase()] as CCQuery;
      },
      /**
       * Retrieves a query by its index from the store.
       *
       * @param index - The index of the query to retrieve.
       * @returns The query at the specified index, or `undefined` if the index is out of bounds.
       */
      getQueryByIndex(index: number): CCQuery | undefined {
        const queries = store.queries() as Record<string, CCQuery>;
        const keys = Object.keys(queries);
        return queries[keys[index]];
      },
      /**
       * Retrieves the default query.
       * The default query is always the first query in the list of queries.
       *
       * @returns {CCQuery | undefined} The default query if it exists, otherwise undefined.
       */
      getDefaultQuery(): CCQuery | undefined {
        return this.getQueryByIndex(0);
      },
      /**
       * Retrieves the allowEmptySearch property for a specific query.
       * @param queryName - The name of the query for which to retrieve allow empty serach property.
       * @returns The allowEmptySearch property for the specified query, or false if not found.
       */
      allowEmptySearch(queryName: string): boolean {
        const queries = store.queries() as Record<string, CCQuery>;
        const keys = Object.keys(queries);

        if (keys.length === 0) return false;

        const query = (queryName && queries[queryName.toLocaleLowerCase()]) || queries[keys[0]];
        return query?.allowEmptySearch || false;
      },
      /**
       * Determines whether labels are allowed by checking the presence of
       * both private and public label fields in the 'labels' web service.
       *
       * @returns {boolean} `true` if both `privateLabelsField` and `publicLabelsField`
       * are defined in the 'labels' web service; otherwise, `false`.
       */
      allowLabels(): boolean {
        const labels = this.getWebServiceByType('labels') as CCWebServiceLabels;
        return labels?.privateLabelsField !== undefined && labels?.publicLabelsField !== undefined;
      },
      /**
       * Retrieves the alias for a given column name from the application's state.
       * If the column has aliases defined, the first alias is returned. Otherwise,
       * the original column name is returned.
       *
       * @param column - The name of the column for which to retrieve the alias.
       * @returns The alias of the column if it exists, otherwise the original column name.
       */
      getColumnAlias(column: string): string {
        const state = getState(store) as CCApp;
        const schema = state.indexes?.['_']?.columns as Record<string, CCColumn>;
        const col = schema[column];
        if (col) {
          return col.aliases?.[0] ? `${col.aliases[0].charAt(0).toLowerCase()}${col.aliases[0].slice(1)}` : column;
        }
        return column;
      },
      /**
       * Retrieves a column definition from the application's state schema by its name.
       *
       * @param column - The name of the column to retrieve.
       * @returns The column definition as a `CCColumn` object if found, or `undefined` if the column does not exist.
       */
      getColumn(column: string): CCColumn | undefined {
        const state = getState(store) as CCApp;
        const schema = state.indexes?.['_']?.columns as Record<string, CCColumn>;
        return schema[column];
      },
      /**
       * Determines if the specified column is of a date-related type.
       *
       * This method checks if the column's type matches one of the following:
       * - `EngineType.date`
       * - `EngineType.dateTime`
       * - `EngineType.time`
       *
       * @param column - The name of the column to check.
       * @returns `true` if the column is of a date-related type; otherwise, `false`.
       */
      isDateColumn(column: string): boolean {
        const col = this.getColumn(column);
        if (col) {
          return col.eType === EngineType.date || col.eType === EngineType.dateTime || col.eType === EngineType.time;
        }
        return false;
      },
      /**
       * Checks if the specified query name corresponds to a tab search.
       * A tab search is defined by the presence of an active tab search configuration
       * with at least one tab defined in the query.
       *
       * @param queryName - The name of the query to check.
       * @returns `true` if the query is a tab search; otherwise, `false`.
       */
      isTabSearch(queryName: string): boolean {
        const query = this.getQueryByName(queryName);
        if (!query) return false;
        const tabSearch = query.tabSearch;
        return !(!tabSearch || !tabSearch.column || !tabSearch.isActive || !tabSearch.tabs || tabSearch.tabs.length === 0);
      },
      /**
       * Retrieves the aggregation count for a specific query and aggregation name.
       * If the count is not defined, it defaults to 10.
       *
       * @param queryName - The name of the query to retrieve the aggregation from.
       * @param aggregationName - The name of the aggregation to retrieve the count for.
       * @returns The count of the specified aggregation, or 10 if not defined.
       */
      getAggregationCount(queryName: string | undefined, aggregationName: string): number {
        if (!queryName) {
          // If queryName is not provided, return the default count
          return 10; // Default to 10 if queryName is not defined
        }
        // If queryName is provided, retrieve the query and its aggregation count
        const query = this.getQueryByName(queryName);
        const agg = query?.aggregations.find(aggregation => aggregation.name === aggregationName);
        return agg ? agg.count : 10; // Default to 10 if count is not defined
      }
    })),
    withMethods((store, aggregationsStore = inject(AggregationsStore), aggregationsNames = inject(AGGREGATIONS_NAMES)) => ({
      /**
       * Retrieves the sorted aggregations based on the query name included in the route data.
       * @param route - The route including the query name to fetch the aggregations for.
       * @returns An array of sorted aggregations.
       */
      getAuthorizedFilters(route: ActivatedRoute) {
        // Get the query name from the route data or use the default query name
        const { queryName = store.getDefaultQuery()?.name } = route.snapshot.data;
        const { aggregations = [] } = store.getQueryByName(queryName) || ({} as CCQuery);

        // when no results are returned, the aggregations may be not available
        const currentAggregations = aggregationsStore.aggregations()?.filter(aggregation => aggregationsNames.includes(aggregation.name.trim())) || [];

        // sort the aggregations based on the query order
        if (Array.isArray(aggregations)) {
          const queryAggregationsOrder = aggregations.map(aggregation => aggregation.name.trim()) || [];
          return currentAggregations.toSorted(
            (a: Aggregation, b: Aggregation) => queryAggregationsOrder.indexOf(a.name) - queryAggregationsOrder.indexOf(b.name)
          );
        }
        // return the default order
        return currentAggregations;
      }
    }))
  );
}

/**
 * Management of customization JSONs features for the app
 */
export function withAppCustomizationFeatures() {
  return signalStoreFeature(
    withState({ customJSONs: [] as SideCJson[], data: {} }),

    withComputed(({ customJSONs, data }) => {
      // Helper function to parse JSON data with common error handling and fallback to default customJSONs
      const parseCustomJson = <T>(jsonName: string, defaultValue: T): T => {
        // Check if customJSONs is defined and is an array
        // If not, return the default value or the value from the main data object
        if (customJSONs() === undefined || Array.isArray(customJSONs()) === false) {
          return (data() as CJsonMint)[jsonName] || defaultValue;
        }

        // Find the custom JSON by name, ignoring case
        // If not found, return the default value or the value from the main data object
        const json = customJSONs()?.find(json => json.name.toLocaleLowerCase() === jsonName);
        if (json === undefined) {
          return (data() as CJsonMint)[jsonName] || defaultValue;
        }

        try {
          // Parse the JSON data
          const parsedData = typeof json?.data === 'string' ? JSON.parse(json.data) : json?.data || defaultValue;
          // If parsedData is a plain empty object ({}), treat it as null/undefined
          if (
            parsedData &&
            typeof parsedData === 'object' &&
            !Array.isArray(parsedData) &&
            Object.getPrototypeOf(parsedData) === Object.prototype &&
            Object.entries(parsedData).length === 0
          ) {
            return (data() as CJsonMint)[jsonName] ?? defaultValue;
          }
          return parsedData ?? (data() as CJsonMint)[jsonName] ?? defaultValue;
        } catch (error) {
          console.error(`Error parsing ${jsonName} JSON:`, error);
          return (data() as CJsonMint)[jsonName] ?? defaultValue;
        }
      };

      return {
        customizationJson: computed(() => data() as CJsonMint),
        sources: computed(() => parseCustomJson<CSources>('sources', {})),
        filters: computed(() => parseCustomJson<CFilter[]>('filters', [])),
        general: computed(() => parseCustomJson<CJsonMint['general']>('general', {})),
        assistants: computed(() => parseCustomJson<Record<string, any>>('assistants', {}))
      };
    }),

    withMethods(store => ({
      /**
       * Retrieves the customization json by name
       * @param name - The name of the customization json
       * @returns The customization json object or undefined if not found
       */
      getNamedCustomizationJson(name: string): any | undefined {
        return store.customJSONs().find(data => data.name.toLocaleLowerCase() === name.toLocaleLowerCase());
      },
      /**
       * Retrieves the icon associated with a given column's aggregation.
       *
       * This method searches through the store's filters to find an aggregation
       * that matches the specified column. If a matching aggregation is found,
       * its associated icon is returned. If no matching aggregation is found in
       * the store's filters, the method falls back to searching in the
       * customizationJson's filters.
       *
       * @param column - The name of the column for which to retrieve the aggregation icon.
       * @returns The icon associated with the specified column's aggregation, or undefined if no matching aggregation is found.
       */
      getAggregationIcon(column: string): string | undefined {
        const predicate = (aggregation: CFilter) => aggregation.column.toLocaleLowerCase() === column.toLocaleLowerCase();
        if (store.filters().length > 0) {
          return store.filters().find(predicate)?.icon;
        }
        // fallback to customizationJson
        return store.customizationJson().filters?.find(predicate)?.icon;
      },
      /**
       * Retrieves the customization items for a given column from the store's filters.
       * If no items are found in the store's filters, it falls back to the customization JSON.
       *
       * @param column - The name of the column for which to retrieve customization items.
       * @returns An array of `CFilterItem` objects if found, otherwise `undefined`.
       */
      getAggregationItemsCustomization(column: string): CFilterItem[] | undefined {
        const predicate = (aggregation: CFilter) => aggregation.column.toLocaleLowerCase() === column.toLocaleLowerCase();
        if (store.filters().length > 0) {
          return store.filters().find(predicate)?.items || [];
        }
        // fallback to customizationJson
        return store.customizationJson().filters?.find(predicate)?.items || [];
      },
      /**
       * Retrieves the customization for a specific aggregation column.
       * @param column - The column name for which to retrieve the customization.
       * @returns The customization object for the specified column, or undefined if not found.
       */
      getAggregationCustomization(column: string): CFilter | undefined {
        const predicate = (aggregation: CFilter) => aggregation.column.toLocaleLowerCase() === column.toLocaleLowerCase();

        // Check if the filters custom JSON file is available in the store
        if (store.filters().length > 0) {
          return store.filters().find(predicate);
        }
        // fallback to customizationJson
        return store.customizationJson().filters?.find(predicate);
      },

      /**
       * Determines whether a specific assistant is allowed based on its presence and configuration in the store.
       *
       * @param assistantName - The name of the assistant to check.
       * @returns `true` if the assistant exists in the store and has a defined `service_id` in its `defaultValues`; otherwise, `false`.
       */
      isAssistantAllowed(assistantName: string): boolean {
        const assistants = store.assistants();
        if (assistants === undefined || Object.keys(assistants).length === 0) return false;
        return assistants[assistantName]?.['defaultValues']?.['service_id'];
      }
    }))
  );
}
