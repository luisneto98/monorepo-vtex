import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
import NotificationsListScreen from '../screens/Notifications/NotificationsListScreen';
import AboutEventScreen from '../screens/AboutEvent/AboutEventScreen';
import SponsorsListScreen from '../screens/Sponsors/SponsorsListScreen';
import SponsorDetailsScreen from '../screens/Sponsors/SponsorDetailsScreen';
import PressMaterialsListScreen from '../screens/PressMaterials/PressMaterialsListScreen';
import PressMaterialDetailModal from '../screens/PressMaterials/PressMaterialDetailModal';
import NewsReleasesListScreen from '../screens/NewsReleases/NewsReleasesListScreen';
import NewsReleaseDetailScreen from '../screens/NewsReleases/NewsReleaseDetailScreen';
import { useNotifications } from '../contexts/NotificationContext';
import { PressMaterial } from '@monorepo-vtex/shared/types/press-materials';

export type RootStackParamList = {
  Main: undefined;
  SessionDetails: { sessionId: string };
  SpeakerProfile: { speakerId: string; sessionId?: string };
  NotificationsList: undefined;
  AboutEvent: undefined;
  Sponsors: undefined;
  SponsorDetails: { sponsorId: string };
  PressMaterials: undefined;
  PressMaterialDetail: { material: PressMaterial };
  NewsReleases: undefined;
  NewsReleaseDetail: { slug: string };
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
      Sponsors: 'sponsors',
      SponsorDetails: {
        path: 'sponsor/:sponsorId',
        parse: {
          sponsorId: (sponsorId: string) => sponsorId,
        },
      },
      PressMaterials: 'press-materials',
      PressMaterialDetail: 'press-material-detail',
      NewsReleases: 'news',
      NewsReleaseDetail: {
        path: 'news/:slug',
        parse: {
          slug: (slug: string) => slug,
        },
      },
    },
  },
};

function TabNavigator() {
  const { unreadCount } = useNotifications();

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
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: styles.badge,
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
        <Stack.Screen
          name="NotificationsList"
          component={NotificationsListScreen}
          options={{
            title: 'Notificações',
            headerBackTitle: 'Voltar',
          }}
        />
        <Stack.Screen
          name="AboutEvent"
          component={AboutEventScreen}
          options={{
            title: 'Sobre o Evento',
            headerBackTitle: 'Voltar',
          }}
        />
        <Stack.Screen
          name="Sponsors"
          component={SponsorsListScreen}
          options={{
            title: 'Patrocinadores',
            headerBackTitle: 'Voltar',
          }}
        />
        <Stack.Screen
          name="SponsorDetails"
          component={SponsorDetailsScreen}
          options={{
            title: 'Detalhes do Patrocinador',
            headerBackTitle: 'Voltar',
          }}
        />
        <Stack.Screen
          name="PressMaterials"
          component={PressMaterialsListScreen}
          options={{
            title: 'Materiais de Imprensa',
            headerBackTitle: 'Voltar',
          }}
        />
        <Stack.Screen
          name="PressMaterialDetail"
          component={PressMaterialDetailModal}
          options={{
            title: 'Detalhes do Material',
            headerBackTitle: 'Voltar',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="NewsReleases"
          component={NewsReleasesListScreen}
          options={{
            title: 'Notícias',
            headerBackTitle: 'Voltar',
          }}
        />
        <Stack.Screen
          name="NewsReleaseDetail"
          component={NewsReleaseDetailScreen}
          options={{
            title: 'Notícia',
            headerBackTitle: 'Voltar',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#F71963',
    color: '#FFFFFF',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    fontSize: 11,
    fontWeight: '600',
  },
});