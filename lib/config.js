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
            cleanArguments: {
                type: 'array',
                description: 'Stack clean command arguments (comma-separated)',
                default: [],
                order: 40,
            },
            depsArguments: {
                type: 'array',
                description: 'Stack install --only-dependencies command arguments (comma-separated)',
                default: [],
                order: 50,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLE1BQU0sV0FBVyxHQUFHO0lBQ2xCLGFBQWEsRUFBRTtRQUNiLEtBQUssRUFBRSx5Q0FBeUM7UUFDaEQsSUFBSSxFQUFFLFNBQVM7UUFDZixPQUFPLEVBQUUsS0FBSztRQUNkLEtBQUssRUFBRSxFQUFFO0tBQ1Y7SUFFRCxNQUFNLEVBQUU7UUFDTixJQUFJLEVBQUUsT0FBTztRQUNiLEtBQUssRUFBRSx1QkFBdUI7UUFDOUIsT0FBTyxFQUFFLEVBQUU7UUFDWCxLQUFLLEVBQUUsRUFBRTtLQUNWO0lBRUQsT0FBTyxFQUFFO1FBQ1AsSUFBSSxFQUFFLFFBQVE7UUFDZCxLQUFLLEVBQUUsNEJBQTRCO1FBQ25DLE9BQU8sRUFBRSxFQUFFO1FBQ1gsS0FBSyxFQUFFLEVBQUU7S0FDVjtJQUVELFFBQVEsRUFBRTtRQUNSLElBQUksRUFBRSxRQUFRO1FBQ2QsS0FBSyxFQUFFLGlCQUFpQjtRQUN4QixPQUFPLEVBQUUsTUFBTTtRQUNmLEtBQUssRUFBRSxFQUFFO0tBQ1Y7Q0FDRixDQUFBO0FBRVksUUFBQSxNQUFNLEdBQUc7SUFDcEIsY0FBYyxFQUFFO1FBQ2QsV0FBVyxFQUFFLDBEQUEwRDtjQUNyRSw0REFBNEQ7Y0FDNUQsNENBQTRDO1FBQzlDLElBQUksRUFBRSxTQUFTO1FBQ2YsT0FBTyxFQUFFLEtBQUs7UUFDZCxLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsS0FBSyxFQUFFO1FBQ0wsSUFBSSxFQUFFLFFBQVE7UUFDZCxVQUFVLEVBQUU7WUFDVixlQUFlLEVBQUU7Z0JBQ2YsSUFBSSxFQUFFLE9BQU87Z0JBQ2IsV0FBVyxFQUFFLDBDQUEwQztnQkFDdkQsT0FBTyxFQUFFLEVBQUU7Z0JBQ1gsS0FBSyxFQUFFLEVBQUU7YUFDVjtZQUNELGNBQWMsRUFBRTtnQkFDZCxJQUFJLEVBQUUsT0FBTztnQkFDYixXQUFXLEVBQUUsaURBQWlEO2dCQUM5RCxPQUFPLEVBQUUsRUFBRTtnQkFDWCxLQUFLLEVBQUUsRUFBRTthQUNWO1lBQ0QsYUFBYSxFQUFFO2dCQUNiLElBQUksRUFBRSxPQUFPO2dCQUNiLFdBQVcsRUFBRSxnREFBZ0Q7Z0JBQzdELE9BQU8sRUFBRSxFQUFFO2dCQUNYLEtBQUssRUFBRSxFQUFFO2FBQ1Y7WUFDRCxjQUFjLEVBQUU7Z0JBQ2QsSUFBSSxFQUFFLE9BQU87Z0JBQ2IsV0FBVyxFQUFFLGlEQUFpRDtnQkFDOUQsT0FBTyxFQUFFLEVBQUU7Z0JBQ1gsS0FBSyxFQUFFLEVBQUU7YUFDVjtZQUNELGNBQWMsRUFBRTtnQkFDZCxJQUFJLEVBQUUsT0FBTztnQkFDYixXQUFXLEVBQUUsaURBQWlEO2dCQUM5RCxPQUFPLEVBQUUsRUFBRTtnQkFDWCxLQUFLLEVBQUUsRUFBRTthQUNWO1lBQ0QsYUFBYSxFQUFFO2dCQUNiLElBQUksRUFBRSxPQUFPO2dCQUNiLFdBQVcsRUFBRSx1RUFBdUU7Z0JBQ3BGLE9BQU8sRUFBRSxFQUFFO2dCQUNYLEtBQUssRUFBRSxFQUFFO2FBQ1Y7U0FDRjtLQUNGO0lBQ0QsS0FBSyxFQUFFO1FBQ0wsSUFBSSxFQUFFLFFBQVE7UUFDZCxVQUFVLEVBQUU7WUFDVixlQUFlLEVBQUU7Z0JBQ2YsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsS0FBSyxFQUFFLHNDQUFzQztnQkFDN0MsV0FBVyxFQUFFLHlEQUF5RDtzQkFDcEUsMERBQTBEO2dCQUM1RCxPQUFPLEVBQUUsS0FBSzthQUNmO1lBQ0QsZ0JBQWdCLEVBQUU7Z0JBQ2hCLElBQUksRUFBRSxRQUFRO2dCQUNkLEtBQUssRUFBRSxvQkFBb0I7Z0JBQzNCLE9BQU8sRUFBRSxNQUFNO2dCQUNmLElBQUksRUFBRSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDO2FBQ2xEO1lBQ0QsTUFBTSxFQUFFO2dCQUNOLElBQUksRUFBRSxRQUFRO2dCQUNkLEtBQUssRUFBRSxTQUFTO2dCQUNoQixVQUFVLEVBQUUsV0FBVzthQUN4QjtZQUNELE1BQU0sRUFBRTtnQkFDTixJQUFJLEVBQUUsUUFBUTtnQkFDZCxLQUFLLEVBQUUsU0FBUztnQkFDaEIsVUFBVSxFQUFFLFdBQVc7YUFDeEI7WUFDRCxNQUFNLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsS0FBSyxFQUFFLFNBQVM7Z0JBQ2hCLFVBQVUsRUFBRSxXQUFXO2FBQ3hCO1lBQ0QsTUFBTSxFQUFFO2dCQUNOLElBQUksRUFBRSxRQUFRO2dCQUNkLEtBQUssRUFBRSxTQUFTO2dCQUNoQixVQUFVLEVBQUUsV0FBVzthQUN4QjtZQUNELE1BQU0sRUFBRTtnQkFDTixJQUFJLEVBQUUsUUFBUTtnQkFDZCxLQUFLLEVBQUUsVUFBVTtnQkFDakIsVUFBVSxFQUFFLFdBQVc7YUFDeEI7WUFDRCxNQUFNLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsS0FBSyxFQUFFLFNBQVM7Z0JBQ2hCLFVBQVUsRUFBRSxXQUFXO2FBQ3hCO1NBQ0Y7S0FDRjtDQUNGLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBnaGNWZXJQcm9wcyA9IHtcbiAgcGF0aEV4Y2x1c2l2ZToge1xuICAgIHRpdGxlOiAnUmVwbGFjZSBQQVRIIChyYXRoZXIgdGhhbiBhcHBlbmQgdG8gaXQpJyxcbiAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgZGVmYXVsdDogZmFsc2UsXG4gICAgb3JkZXI6IDEwLFxuICB9LFxuXG4gIHBhdGhUbzoge1xuICAgIHR5cGU6ICdhcnJheScsXG4gICAgdGl0bGU6ICdQQVRIOyBjb21tYS1zZXBhcmF0ZWQnLFxuICAgIGRlZmF1bHQ6IFtdLFxuICAgIG9yZGVyOiAyMCxcbiAgfSxcblxuICBzYW5kYm94OiB7XG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgdGl0bGU6ICdTYW5kYm94IGNvbmZpZ3VyYXRpb24gZmlsZScsXG4gICAgZGVmYXVsdDogJycsXG4gICAgb3JkZXI6IDMwLFxuICB9LFxuXG4gIGJ1aWxkRGlyOiB7XG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgdGl0bGU6ICdCdWlsZCBkaXJlY3RvcnknLFxuICAgIGRlZmF1bHQ6ICdkaXN0JyxcbiAgICBvcmRlcjogNDAsXG4gIH0sXG59XG5cbmV4cG9ydCBjb25zdCBjb25maWcgPSB7XG4gIGVuYWJsZU5peEJ1aWxkOiB7XG4gICAgZGVzY3JpcHRpb246ICdFbmFibGUgdGVjaG5pY2FsIHByZXZpZXcgZm9yIGNhYmFsIG5ldy1idWlsZCBpbnRyb2R1Y2VkICdcbiAgICArICd3aXRoIGNhYmFsLTEuMjQuIFdBUk5JTkc6IHRoaXMgd2lsbCBicmVhayBnaGMtbW9kISBEbyBub3QgJ1xuICAgICsgJ2VuYWJsZSB1bmxlc3MgeW91IGtub3cgd2hhdCB5b3UgYXJlIGRvaW5nIScsXG4gICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgIG9yZGVyOiAwLFxuICB9LFxuICBzdGFjazoge1xuICAgIHR5cGU6ICdvYmplY3QnLFxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgIGdsb2JhbEFyZ3VtZW50czoge1xuICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0dsb2JhbCBzdGFjayBhcmd1bWVudHMgKGNvbW1hLXNlcGFyYXRlZCknLFxuICAgICAgICBkZWZhdWx0OiBbXSxcbiAgICAgICAgb3JkZXI6IDEwLFxuICAgICAgfSxcbiAgICAgIGJ1aWxkQXJndW1lbnRzOiB7XG4gICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU3RhY2sgYnVpbGQgY29tbWFuZCBhcmd1bWVudHMgKGNvbW1hLXNlcGFyYXRlZCknLFxuICAgICAgICBkZWZhdWx0OiBbXSxcbiAgICAgICAgb3JkZXI6IDIwLFxuICAgICAgfSxcbiAgICAgIHRlc3RBcmd1bWVudHM6IHtcbiAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTdGFjayB0ZXN0IGNvbW1hbmQgYXJndW1lbnRzIChjb21tYS1zZXBhcmF0ZWQpJyxcbiAgICAgICAgZGVmYXVsdDogW10sXG4gICAgICAgIG9yZGVyOiAzMCxcbiAgICAgIH0sXG4gICAgICBiZW5jaEFyZ3VtZW50czoge1xuICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1N0YWNrIGJlbmNoIGNvbW1hbmQgYXJndW1lbnRzIChjb21tYS1zZXBhcmF0ZWQpJyxcbiAgICAgICAgZGVmYXVsdDogW10sXG4gICAgICAgIG9yZGVyOiAzMCxcbiAgICAgIH0sXG4gICAgICBjbGVhbkFyZ3VtZW50czoge1xuICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1N0YWNrIGNsZWFuIGNvbW1hbmQgYXJndW1lbnRzIChjb21tYS1zZXBhcmF0ZWQpJyxcbiAgICAgICAgZGVmYXVsdDogW10sXG4gICAgICAgIG9yZGVyOiA0MCxcbiAgICAgIH0sXG4gICAgICBkZXBzQXJndW1lbnRzOiB7XG4gICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU3RhY2sgaW5zdGFsbCAtLW9ubHktZGVwZW5kZW5jaWVzIGNvbW1hbmQgYXJndW1lbnRzIChjb21tYS1zZXBhcmF0ZWQpJyxcbiAgICAgICAgZGVmYXVsdDogW10sXG4gICAgICAgIG9yZGVyOiA1MCxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgY2FiYWw6IHtcbiAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBpZ25vcmVOb1NhbmRib3g6IHtcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICB0aXRsZTogJ0luc3RhbGwgZGVwZW5kZW5jaWVzIHdpdGggbm8gc2FuZGJveCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnSW5zdGFsbGluZyBkZXBlbmRlbmNpZXMgd2l0aCBubyBwcm9qZWN0IHNhbmRib3ggaXMgbm90ICdcbiAgICAgICAgKyAncmVjb21tZW5kZWQsIGJ1dCB5b3UgY2FuIGRvIGl0IGlmIHlvdSBlbmFibGUgdGhpcyBvcHRpb24nLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICBhY3RpdmVHaGNWZXJzaW9uOiB7XG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICB0aXRsZTogJ0FjdGl2ZSBHSEMgdmVyc2lvbicsXG4gICAgICAgIGRlZmF1bHQ6ICc3LjEwJyxcbiAgICAgICAgZW51bTogWyc3LjInLCAnNy40JywgJzcuNicsICc3LjgnLCAnNy4xMCcsICc4LjAnXSxcbiAgICAgIH0sXG4gICAgICBnaGM3MDI6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHRpdGxlOiAnR0hDIDcuMicsXG4gICAgICAgIHByb3BlcnRpZXM6IGdoY1ZlclByb3BzLFxuICAgICAgfSxcbiAgICAgIGdoYzcwNDoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgdGl0bGU6ICdHSEMgNy40JyxcbiAgICAgICAgcHJvcGVydGllczogZ2hjVmVyUHJvcHMsXG4gICAgICB9LFxuICAgICAgZ2hjNzA2OiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICB0aXRsZTogJ0dIQyA3LjYnLFxuICAgICAgICBwcm9wZXJ0aWVzOiBnaGNWZXJQcm9wcyxcbiAgICAgIH0sXG4gICAgICBnaGM3MDg6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHRpdGxlOiAnR0hDIDcuOCcsXG4gICAgICAgIHByb3BlcnRpZXM6IGdoY1ZlclByb3BzLFxuICAgICAgfSxcbiAgICAgIGdoYzcxMDoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgdGl0bGU6ICdHSEMgNy4xMCcsXG4gICAgICAgIHByb3BlcnRpZXM6IGdoY1ZlclByb3BzLFxuICAgICAgfSxcbiAgICAgIGdoYzgwMDoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgdGl0bGU6ICdHSEMgOC4wJyxcbiAgICAgICAgcHJvcGVydGllczogZ2hjVmVyUHJvcHMsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59XG4iXX0=