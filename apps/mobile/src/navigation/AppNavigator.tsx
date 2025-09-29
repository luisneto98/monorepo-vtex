import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';

import HomeScreen from '../screens/Home/HomeScreen';
import AgendaScreen from '../screens/Agenda/AgendaScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import MoreScreen from '../screens/More/MoreScreen';
import SessionDetailsScreen from '../screens/SessionDetails/SessionDetailsScreen';
import SpeakerProfileScreen from '../screens/SpeakerProfile/SpeakerProfileScreen';

export type RootStackParamList = {
  Main: undefined;
  SessionDetails: { sessionId: string };
  SpeakerProfile: { speakerId: string; sessionId?: string };
};

export type TabParamList = {
  Home: undefined;
  Agenda: undefined;
  Search: undefined;
  More: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const prefix = Linking.createURL('/');

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, 'vtexevents://'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Agenda: 'agenda',
          Search: 'search',
          More: 'more',
        },
      },
      SessionDetails: {
        path: 'session/:sessionId',
        parse: {
          sessionId: (sessionId: string) => sessionId,
        },
      },
      SpeakerProfile: {
        path: 'speaker/:speakerId',
        parse: {
          speakerId: (speakerId: string) => speakerId,
        },
      },
    },
  },
};

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#0F47AF',
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Agenda"
        component={AgendaScreen}
        options={{
          tabBarLabel: 'Agenda',
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Buscar',
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarLabel: 'Mais',
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#0F47AF',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SessionDetails"
          component={SessionDetailsScreen}
          options={{
            title: 'Detalhes da Sessão',
            headerBackTitle: 'Voltar',
          }}
        />
        <Stack.Screen
          name="SpeakerProfile"
          component={SpeakerProfileScreen}
          options={{
            title: 'Perfil do Palestrante',
            headerBackTitle: 'Voltar',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}