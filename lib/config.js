"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ghcVerProps = {
    pathExclusive: {
        title: 'Replace PATH (rather than append to it)',
        type: 'boolean',
        default: false,
        order: 10,
    },
    pathTo: {
        type: 'array',
        title: 'PATH; comma-separated',
        default: [],
        order: 20,
    },
    sandbox: {
        type: 'string',
        title: 'Sandbox configuration file',
        default: '',
        order: 30,
    },
    buildDir: {
        type: 'string',
        title: 'Build directory',
        default: 'dist',
        order: 40,
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
        },
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLE1BQU0sV0FBVyxHQUFHO0lBQ2xCLGFBQWEsRUFBRTtRQUNiLEtBQUssRUFBRSx5Q0FBeUM7UUFDaEQsSUFBSSxFQUFFLFNBQVM7UUFDZixPQUFPLEVBQUUsS0FBSztRQUNkLEtBQUssRUFBRSxFQUFFO0tBQ1Y7SUFFRCxNQUFNLEVBQUU7UUFDTixJQUFJLEVBQUUsT0FBTztRQUNiLEtBQUssRUFBRSx1QkFBdUI7UUFDOUIsT0FBTyxFQUFFLEVBQUU7UUFDWCxLQUFLLEVBQUUsRUFBRTtLQUNWO0lBRUQsT0FBTyxFQUFFO1FBQ1AsSUFBSSxFQUFFLFFBQVE7UUFDZCxLQUFLLEVBQUUsNEJBQTRCO1FBQ25DLE9BQU8sRUFBRSxFQUFFO1FBQ1gsS0FBSyxFQUFFLEVBQUU7S0FDVjtJQUVELFFBQVEsRUFBRTtRQUNSLElBQUksRUFBRSxRQUFRO1FBQ2QsS0FBSyxFQUFFLGlCQUFpQjtRQUN4QixPQUFPLEVBQUUsTUFBTTtRQUNmLEtBQUssRUFBRSxFQUFFO0tBQ1Y7Q0FDRixDQUFBO0FBRVksUUFBQSxNQUFNLEdBQUc7SUFDcEIsY0FBYyxFQUFFO1FBQ2QsV0FBVyxFQUFFLDBEQUEwRDtjQUNyRSw0REFBNEQ7Y0FDNUQsNENBQTRDO1FBQzlDLElBQUksRUFBRSxTQUFTO1FBQ2YsT0FBTyxFQUFFLEtBQUs7UUFDZCxLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsS0FBSyxFQUFFO1FBQ0wsSUFBSSxFQUFFLFFBQVE7UUFDZCxVQUFVLEVBQUU7WUFDVixlQUFlLEVBQUU7Z0JBQ2YsSUFBSSxFQUFFLE9BQU87Z0JBQ2IsV0FBVyxFQUFFLDBDQUEwQztnQkFDdkQsT0FBTyxFQUFFLEVBQUU7Z0JBQ1gsS0FBSyxFQUFFLEVBQUU7YUFDVjtZQUNELGNBQWMsRUFBRTtnQkFDZCxJQUFJLEVBQUUsT0FBTztnQkFDYixXQUFXLEVBQUUsaURBQWlEO2dCQUM5RCxPQUFPLEVBQUUsRUFBRTtnQkFDWCxLQUFLLEVBQUUsRUFBRTthQUNWO1lBQ0QsYUFBYSxFQUFFO2dCQUNiLElBQUksRUFBRSxPQUFPO2dCQUNiLFdBQVcsRUFBRSxnREFBZ0Q7Z0JBQzdELE9BQU8sRUFBRSxFQUFFO2dCQUNYLEtBQUssRUFBRSxFQUFFO2FBQ1Y7WUFDRCxjQUFjLEVBQUU7Z0JBQ2QsSUFBSSxFQUFFLE9BQU87Z0JBQ2IsV0FBVyxFQUFFLGlEQUFpRDtnQkFDOUQsT0FBTyxFQUFFLEVBQUU7Z0JBQ1gsS0FBSyxFQUFFLEVBQUU7YUFDVjtTQUNGO0tBQ0Y7SUFDRCxLQUFLLEVBQUU7UUFDTCxJQUFJLEVBQUUsUUFBUTtRQUNkLFVBQVUsRUFBRTtZQUNWLGVBQWUsRUFBRTtnQkFDZixJQUFJLEVBQUUsU0FBUztnQkFDZixLQUFLLEVBQUUsc0NBQXNDO2dCQUM3QyxXQUFXLEVBQUUseURBQXlEO3NCQUNwRSwwREFBMEQ7Z0JBQzVELE9BQU8sRUFBRSxLQUFLO2FBQ2Y7WUFDRCxnQkFBZ0IsRUFBRTtnQkFDaEIsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsS0FBSyxFQUFFLG9CQUFvQjtnQkFDM0IsT0FBTyxFQUFFLE1BQU07Z0JBQ2YsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUM7YUFDbEQ7WUFDRCxNQUFNLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsS0FBSyxFQUFFLFNBQVM7Z0JBQ2hCLFVBQVUsRUFBRSxXQUFXO2FBQ3hCO1lBQ0QsTUFBTSxFQUFFO2dCQUNOLElBQUksRUFBRSxRQUFRO2dCQUNkLEtBQUssRUFBRSxTQUFTO2dCQUNoQixVQUFVLEVBQUUsV0FBVzthQUN4QjtZQUNELE1BQU0sRUFBRTtnQkFDTixJQUFJLEVBQUUsUUFBUTtnQkFDZCxLQUFLLEVBQUUsU0FBUztnQkFDaEIsVUFBVSxFQUFFLFdBQVc7YUFDeEI7WUFDRCxNQUFNLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsS0FBSyxFQUFFLFNBQVM7Z0JBQ2hCLFVBQVUsRUFBRSxXQUFXO2FBQ3hCO1lBQ0QsTUFBTSxFQUFFO2dCQUNOLElBQUksRUFBRSxRQUFRO2dCQUNkLEtBQUssRUFBRSxVQUFVO2dCQUNqQixVQUFVLEVBQUUsV0FBVzthQUN4QjtZQUNELE1BQU0sRUFBRTtnQkFDTixJQUFJLEVBQUUsUUFBUTtnQkFDZCxLQUFLLEVBQUUsU0FBUztnQkFDaEIsVUFBVSxFQUFFLFdBQVc7YUFDeEI7U0FDRjtLQUNGO0NBQ0YsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGdoY1ZlclByb3BzID0ge1xuICBwYXRoRXhjbHVzaXZlOiB7XG4gICAgdGl0bGU6ICdSZXBsYWNlIFBBVEggKHJhdGhlciB0aGFuIGFwcGVuZCB0byBpdCknLFxuICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICBvcmRlcjogMTAsXG4gIH0sXG5cbiAgcGF0aFRvOiB7XG4gICAgdHlwZTogJ2FycmF5JyxcbiAgICB0aXRsZTogJ1BBVEg7IGNvbW1hLXNlcGFyYXRlZCcsXG4gICAgZGVmYXVsdDogW10sXG4gICAgb3JkZXI6IDIwLFxuICB9LFxuXG4gIHNhbmRib3g6IHtcbiAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICB0aXRsZTogJ1NhbmRib3ggY29uZmlndXJhdGlvbiBmaWxlJyxcbiAgICBkZWZhdWx0OiAnJyxcbiAgICBvcmRlcjogMzAsXG4gIH0sXG5cbiAgYnVpbGREaXI6IHtcbiAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICB0aXRsZTogJ0J1aWxkIGRpcmVjdG9yeScsXG4gICAgZGVmYXVsdDogJ2Rpc3QnLFxuICAgIG9yZGVyOiA0MCxcbiAgfSxcbn1cblxuZXhwb3J0IGNvbnN0IGNvbmZpZyA9IHtcbiAgZW5hYmxlTml4QnVpbGQ6IHtcbiAgICBkZXNjcmlwdGlvbjogJ0VuYWJsZSB0ZWNobmljYWwgcHJldmlldyBmb3IgY2FiYWwgbmV3LWJ1aWxkIGludHJvZHVjZWQgJ1xuICAgICsgJ3dpdGggY2FiYWwtMS4yNC4gV0FSTklORzogdGhpcyB3aWxsIGJyZWFrIGdoYy1tb2QhIERvIG5vdCAnXG4gICAgKyAnZW5hYmxlIHVubGVzcyB5b3Uga25vdyB3aGF0IHlvdSBhcmUgZG9pbmchJyxcbiAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgZGVmYXVsdDogZmFsc2UsXG4gICAgb3JkZXI6IDAsXG4gIH0sXG4gIHN0YWNrOiB7XG4gICAgdHlwZTogJ29iamVjdCcsXG4gICAgcHJvcGVydGllczoge1xuICAgICAgZ2xvYmFsQXJndW1lbnRzOiB7XG4gICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnR2xvYmFsIHN0YWNrIGFyZ3VtZW50cyAoY29tbWEtc2VwYXJhdGVkKScsXG4gICAgICAgIGRlZmF1bHQ6IFtdLFxuICAgICAgICBvcmRlcjogMTAsXG4gICAgICB9LFxuICAgICAgYnVpbGRBcmd1bWVudHM6IHtcbiAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTdGFjayBidWlsZCBjb21tYW5kIGFyZ3VtZW50cyAoY29tbWEtc2VwYXJhdGVkKScsXG4gICAgICAgIGRlZmF1bHQ6IFtdLFxuICAgICAgICBvcmRlcjogMjAsXG4gICAgICB9LFxuICAgICAgdGVzdEFyZ3VtZW50czoge1xuICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1N0YWNrIHRlc3QgY29tbWFuZCBhcmd1bWVudHMgKGNvbW1hLXNlcGFyYXRlZCknLFxuICAgICAgICBkZWZhdWx0OiBbXSxcbiAgICAgICAgb3JkZXI6IDMwLFxuICAgICAgfSxcbiAgICAgIGJlbmNoQXJndW1lbnRzOiB7XG4gICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU3RhY2sgYmVuY2ggY29tbWFuZCBhcmd1bWVudHMgKGNvbW1hLXNlcGFyYXRlZCknLFxuICAgICAgICBkZWZhdWx0OiBbXSxcbiAgICAgICAgb3JkZXI6IDMwLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBjYWJhbDoge1xuICAgIHR5cGU6ICdvYmplY3QnLFxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgIGlnbm9yZU5vU2FuZGJveDoge1xuICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIHRpdGxlOiAnSW5zdGFsbCBkZXBlbmRlbmNpZXMgd2l0aCBubyBzYW5kYm94JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdJbnN0YWxsaW5nIGRlcGVuZGVuY2llcyB3aXRoIG5vIHByb2plY3Qgc2FuZGJveCBpcyBub3QgJ1xuICAgICAgICArICdyZWNvbW1lbmRlZCwgYnV0IHlvdSBjYW4gZG8gaXQgaWYgeW91IGVuYWJsZSB0aGlzIG9wdGlvbicsXG4gICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIGFjdGl2ZUdoY1ZlcnNpb246IHtcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIHRpdGxlOiAnQWN0aXZlIEdIQyB2ZXJzaW9uJyxcbiAgICAgICAgZGVmYXVsdDogJzcuMTAnLFxuICAgICAgICBlbnVtOiBbJzcuMicsICc3LjQnLCAnNy42JywgJzcuOCcsICc3LjEwJywgJzguMCddLFxuICAgICAgfSxcbiAgICAgIGdoYzcwMjoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgdGl0bGU6ICdHSEMgNy4yJyxcbiAgICAgICAgcHJvcGVydGllczogZ2hjVmVyUHJvcHMsXG4gICAgICB9LFxuICAgICAgZ2hjNzA0OiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICB0aXRsZTogJ0dIQyA3LjQnLFxuICAgICAgICBwcm9wZXJ0aWVzOiBnaGNWZXJQcm9wcyxcbiAgICAgIH0sXG4gICAgICBnaGM3MDY6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHRpdGxlOiAnR0hDIDcuNicsXG4gICAgICAgIHByb3BlcnRpZXM6IGdoY1ZlclByb3BzLFxuICAgICAgfSxcbiAgICAgIGdoYzcwODoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgdGl0bGU6ICdHSEMgNy44JyxcbiAgICAgICAgcHJvcGVydGllczogZ2hjVmVyUHJvcHMsXG4gICAgICB9LFxuICAgICAgZ2hjNzEwOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICB0aXRsZTogJ0dIQyA3LjEwJyxcbiAgICAgICAgcHJvcGVydGllczogZ2hjVmVyUHJvcHMsXG4gICAgICB9LFxuICAgICAgZ2hjODAwOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICB0aXRsZTogJ0dIQyA4LjAnLFxuICAgICAgICBwcm9wZXJ0aWVzOiBnaGNWZXJQcm9wcyxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn1cbiJdfQ==