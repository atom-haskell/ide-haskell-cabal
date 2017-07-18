"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ghcVerProps = {
    pathExclusive: {
        title: 'Replace PATH (rather than append to it)',
        type: 'boolean',
        default: false,
        order: 10
    },
    pathTo: {
        type: 'array',
        title: 'PATH; comma-separated',
        default: [],
        order: 20
    },
    sandbox: {
        type: 'string',
        title: 'Sandbox configuration file',
        default: '',
        order: 30
    },
    buildDir: {
        type: 'string',
        title: 'Build directory',
        default: 'dist',
        order: 40
    },
};
exports.config = {
    enableNixBuild: {
        description: 'Enable technical preview for cabal new-build introduced '
            + 'with cabal-1.24. WARNING: this will break ghc-mod! Do not '
            + 'enable unless you know what you are doing!',
        type: 'boolean',
        default: false,
        order: 0,
    },
    stack: {
        type: 'object',
        properties: {
            globalArguments: {
                type: 'array',
                description: 'Global stack arguments (comma-separated)',
                default: [],
                order: 10,
            },
            buildArguments: {
                type: 'array',
                description: 'Stack build command arguments (comma-separated)',
                default: [],
                order: 20,
            },
            testArguments: {
                type: 'array',
                description: 'Stack test command arguments (comma-separated)',
                default: [],
                order: 30,
            },
            benchArguments: {
                type: 'array',
                description: 'Stack bench command arguments (comma-separated)',
                default: [],
                order: 30,
            },
        },
    },
    cabal: {
        type: 'object',
        properties: {
            ignoreNoSandbox: {
                type: 'boolean',
                title: 'Install dependencies with no sandbox',
                description: 'Installing dependencies with no project sandbox is not '
                    + 'recommended, but you can do it if you enable this option',
                default: false,
            },
            activeGhcVersion: {
                type: 'string',
                title: 'Active GHC version',
                default: '7.10',
                enum: ['7.2', '7.4', '7.6', '7.8', '7.10', '8.0'],
            },
            ghc702: {
                type: 'object',
                title: 'GHC 7.2',
                properties: ghcVerProps,
            },
            ghc704: {
                type: 'object',
                title: 'GHC 7.4',
                properties: ghcVerProps,
            },
            ghc706: {
                type: 'object',
                title: 'GHC 7.6',
                properties: ghcVerProps,
            },
            ghc708: {
                type: 'object',
                title: 'GHC 7.8',
                properties: ghcVerProps,
            },
            ghc710: {
                type: 'object',
                title: 'GHC 7.10',
                properties: ghcVerProps,
            },
            ghc800: {
                type: 'object',
                title: 'GHC 8.0',
                properties: ghcVerProps,
            },
        }
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLE1BQU0sV0FBVyxHQUFHO0lBQ2xCLGFBQWEsRUFBRTtRQUNYLEtBQUssRUFBRSx5Q0FBeUM7UUFDaEQsSUFBSSxFQUFFLFNBQVM7UUFDZixPQUFPLEVBQUUsS0FBSztRQUNkLEtBQUssRUFBRSxFQUFFO0tBQ1o7SUFFRCxNQUFNLEVBQUU7UUFDSixJQUFJLEVBQUUsT0FBTztRQUNiLEtBQUssRUFBRSx1QkFBdUI7UUFDOUIsT0FBTyxFQUFFLEVBQUU7UUFDWCxLQUFLLEVBQUUsRUFBRTtLQUNaO0lBRUQsT0FBTyxFQUFFO1FBQ0wsSUFBSSxFQUFFLFFBQVE7UUFDZCxLQUFLLEVBQUUsNEJBQTRCO1FBQ25DLE9BQU8sRUFBRSxFQUFFO1FBQ1gsS0FBSyxFQUFFLEVBQUU7S0FDWjtJQUVELFFBQVEsRUFBRTtRQUNOLElBQUksRUFBRSxRQUFRO1FBQ2QsS0FBSyxFQUFFLGlCQUFpQjtRQUN4QixPQUFPLEVBQUUsTUFBTTtRQUNmLEtBQUssRUFBRSxFQUFFO0tBQ1o7Q0FDRixDQUFBO0FBRVksUUFBQSxNQUFNLEdBQUc7SUFDcEIsY0FBYyxFQUFFO1FBQ2QsV0FBVyxFQUFHLDBEQUEwRDtjQUMxRCw0REFBNEQ7Y0FDNUQsNENBQTRDO1FBQzFELElBQUksRUFBRSxTQUFTO1FBQ2YsT0FBTyxFQUFFLEtBQUs7UUFDZCxLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsS0FBSyxFQUFFO1FBQ0wsSUFBSSxFQUFFLFFBQVE7UUFDZCxVQUFVLEVBQUU7WUFDVixlQUFlLEVBQUU7Z0JBQ2YsSUFBSSxFQUFFLE9BQU87Z0JBQ2IsV0FBVyxFQUFFLDBDQUEwQztnQkFDdkQsT0FBTyxFQUFFLEVBQUU7Z0JBQ1gsS0FBSyxFQUFFLEVBQUU7YUFDVjtZQUNELGNBQWMsRUFBRTtnQkFDZCxJQUFJLEVBQUUsT0FBTztnQkFDYixXQUFXLEVBQUUsaURBQWlEO2dCQUM5RCxPQUFPLEVBQUUsRUFBRTtnQkFDWCxLQUFLLEVBQUUsRUFBRTthQUNWO1lBQ0QsYUFBYSxFQUFFO2dCQUNiLElBQUksRUFBRSxPQUFPO2dCQUNiLFdBQVcsRUFBRSxnREFBZ0Q7Z0JBQzdELE9BQU8sRUFBRSxFQUFFO2dCQUNYLEtBQUssRUFBRSxFQUFFO2FBQ1Y7WUFDRCxjQUFjLEVBQUU7Z0JBQ2QsSUFBSSxFQUFFLE9BQU87Z0JBQ2IsV0FBVyxFQUFFLGlEQUFpRDtnQkFDOUQsT0FBTyxFQUFFLEVBQUU7Z0JBQ1gsS0FBSyxFQUFFLEVBQUU7YUFDVjtTQUNGO0tBQ0Y7SUFDRCxLQUFLLEVBQUU7UUFDTCxJQUFJLEVBQUUsUUFBUTtRQUNkLFVBQVUsRUFBRTtZQUNWLGVBQWUsRUFBRTtnQkFDZixJQUFJLEVBQUUsU0FBUztnQkFDZixLQUFLLEVBQUUsc0NBQXNDO2dCQUM3QyxXQUFXLEVBQUcseURBQXlEO3NCQUN6RCwwREFBMEQ7Z0JBQ3hFLE9BQU8sRUFBRSxLQUFLO2FBQ2Y7WUFDRCxnQkFBZ0IsRUFBRTtnQkFDaEIsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsS0FBSyxFQUFFLG9CQUFvQjtnQkFDM0IsT0FBTyxFQUFFLE1BQU07Z0JBQ2YsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUM7YUFDbEQ7WUFDRCxNQUFNLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsS0FBSyxFQUFFLFNBQVM7Z0JBQ2hCLFVBQVUsRUFBRSxXQUFXO2FBQ3hCO1lBQ0QsTUFBTSxFQUFFO2dCQUNOLElBQUksRUFBRSxRQUFRO2dCQUNkLEtBQUssRUFBRSxTQUFTO2dCQUNoQixVQUFVLEVBQUUsV0FBVzthQUN4QjtZQUNELE1BQU0sRUFBRTtnQkFDTixJQUFJLEVBQUUsUUFBUTtnQkFDZCxLQUFLLEVBQUUsU0FBUztnQkFDaEIsVUFBVSxFQUFFLFdBQVc7YUFDeEI7WUFDRCxNQUFNLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsS0FBSyxFQUFFLFNBQVM7Z0JBQ2hCLFVBQVUsRUFBRSxXQUFXO2FBQ3hCO1lBQ0QsTUFBTSxFQUFFO2dCQUNOLElBQUksRUFBRSxRQUFRO2dCQUNkLEtBQUssRUFBRSxVQUFVO2dCQUNqQixVQUFVLEVBQUUsV0FBVzthQUN4QjtZQUNELE1BQU0sRUFBRTtnQkFDTixJQUFJLEVBQUUsUUFBUTtnQkFDZCxLQUFLLEVBQUUsU0FBUztnQkFDaEIsVUFBVSxFQUFFLFdBQVc7YUFDeEI7U0FDRjtLQUNGO0NBQ0YsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGdoY1ZlclByb3BzID0ge1xuICBwYXRoRXhjbHVzaXZlOiB7XG4gICAgICB0aXRsZTogJ1JlcGxhY2UgUEFUSCAocmF0aGVyIHRoYW4gYXBwZW5kIHRvIGl0KSdcbiAgICAsIHR5cGU6ICdib29sZWFuJ1xuICAgICwgZGVmYXVsdDogZmFsc2VcbiAgICAsIG9yZGVyOiAxMFxuICB9LFxuXG4gIHBhdGhUbzoge1xuICAgICAgdHlwZTogJ2FycmF5J1xuICAgICwgdGl0bGU6ICdQQVRIOyBjb21tYS1zZXBhcmF0ZWQnXG4gICAgLCBkZWZhdWx0OiBbXVxuICAgICwgb3JkZXI6IDIwXG4gIH0sXG5cbiAgc2FuZGJveDoge1xuICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAsIHRpdGxlOiAnU2FuZGJveCBjb25maWd1cmF0aW9uIGZpbGUnXG4gICAgLCBkZWZhdWx0OiAnJ1xuICAgICwgb3JkZXI6IDMwXG4gIH0sXG5cbiAgYnVpbGREaXI6IHtcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgLCB0aXRsZTogJ0J1aWxkIGRpcmVjdG9yeSdcbiAgICAsIGRlZmF1bHQ6ICdkaXN0J1xuICAgICwgb3JkZXI6IDQwXG4gIH0sXG59XG5cbmV4cG9ydCBjb25zdCBjb25maWcgPSB7XG4gIGVuYWJsZU5peEJ1aWxkOiB7XG4gICAgZGVzY3JpcHRpb246ICAnRW5hYmxlIHRlY2huaWNhbCBwcmV2aWV3IGZvciBjYWJhbCBuZXctYnVpbGQgaW50cm9kdWNlZCAnXG4gICAgICAgICAgICAgICAgKyAnd2l0aCBjYWJhbC0xLjI0LiBXQVJOSU5HOiB0aGlzIHdpbGwgYnJlYWsgZ2hjLW1vZCEgRG8gbm90ICdcbiAgICAgICAgICAgICAgICArICdlbmFibGUgdW5sZXNzIHlvdSBrbm93IHdoYXQgeW91IGFyZSBkb2luZyEnLFxuICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICBvcmRlcjogMCxcbiAgfSxcbiAgc3RhY2s6IHtcbiAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBnbG9iYWxBcmd1bWVudHM6IHtcbiAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdHbG9iYWwgc3RhY2sgYXJndW1lbnRzIChjb21tYS1zZXBhcmF0ZWQpJyxcbiAgICAgICAgZGVmYXVsdDogW10sXG4gICAgICAgIG9yZGVyOiAxMCxcbiAgICAgIH0sXG4gICAgICBidWlsZEFyZ3VtZW50czoge1xuICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1N0YWNrIGJ1aWxkIGNvbW1hbmQgYXJndW1lbnRzIChjb21tYS1zZXBhcmF0ZWQpJyxcbiAgICAgICAgZGVmYXVsdDogW10sXG4gICAgICAgIG9yZGVyOiAyMCxcbiAgICAgIH0sXG4gICAgICB0ZXN0QXJndW1lbnRzOiB7XG4gICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU3RhY2sgdGVzdCBjb21tYW5kIGFyZ3VtZW50cyAoY29tbWEtc2VwYXJhdGVkKScsXG4gICAgICAgIGRlZmF1bHQ6IFtdLFxuICAgICAgICBvcmRlcjogMzAsXG4gICAgICB9LFxuICAgICAgYmVuY2hBcmd1bWVudHM6IHtcbiAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTdGFjayBiZW5jaCBjb21tYW5kIGFyZ3VtZW50cyAoY29tbWEtc2VwYXJhdGVkKScsXG4gICAgICAgIGRlZmF1bHQ6IFtdLFxuICAgICAgICBvcmRlcjogMzAsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIGNhYmFsOiB7XG4gICAgdHlwZTogJ29iamVjdCcsXG4gICAgcHJvcGVydGllczoge1xuICAgICAgaWdub3JlTm9TYW5kYm94OiB7XG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgdGl0bGU6ICdJbnN0YWxsIGRlcGVuZGVuY2llcyB3aXRoIG5vIHNhbmRib3gnLFxuICAgICAgICBkZXNjcmlwdGlvbjogICdJbnN0YWxsaW5nIGRlcGVuZGVuY2llcyB3aXRoIG5vIHByb2plY3Qgc2FuZGJveCBpcyBub3QgJ1xuICAgICAgICAgICAgICAgICAgICArICdyZWNvbW1lbmRlZCwgYnV0IHlvdSBjYW4gZG8gaXQgaWYgeW91IGVuYWJsZSB0aGlzIG9wdGlvbicsXG4gICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIGFjdGl2ZUdoY1ZlcnNpb246IHtcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIHRpdGxlOiAnQWN0aXZlIEdIQyB2ZXJzaW9uJyxcbiAgICAgICAgZGVmYXVsdDogJzcuMTAnLFxuICAgICAgICBlbnVtOiBbJzcuMicsICc3LjQnLCAnNy42JywgJzcuOCcsICc3LjEwJywgJzguMCddLFxuICAgICAgfSxcbiAgICAgIGdoYzcwMjoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgdGl0bGU6ICdHSEMgNy4yJyxcbiAgICAgICAgcHJvcGVydGllczogZ2hjVmVyUHJvcHMsXG4gICAgICB9LFxuICAgICAgZ2hjNzA0OiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICB0aXRsZTogJ0dIQyA3LjQnLFxuICAgICAgICBwcm9wZXJ0aWVzOiBnaGNWZXJQcm9wcyxcbiAgICAgIH0sXG4gICAgICBnaGM3MDY6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHRpdGxlOiAnR0hDIDcuNicsXG4gICAgICAgIHByb3BlcnRpZXM6IGdoY1ZlclByb3BzLFxuICAgICAgfSxcbiAgICAgIGdoYzcwODoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgdGl0bGU6ICdHSEMgNy44JyxcbiAgICAgICAgcHJvcGVydGllczogZ2hjVmVyUHJvcHMsXG4gICAgICB9LFxuICAgICAgZ2hjNzEwOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICB0aXRsZTogJ0dIQyA3LjEwJyxcbiAgICAgICAgcHJvcGVydGllczogZ2hjVmVyUHJvcHMsXG4gICAgICB9LFxuICAgICAgZ2hjODAwOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICB0aXRsZTogJ0dIQyA4LjAnLFxuICAgICAgICBwcm9wZXJ0aWVzOiBnaGNWZXJQcm9wcyxcbiAgICAgIH0sXG4gICAgfVxuICB9XG59XG4iXX0=