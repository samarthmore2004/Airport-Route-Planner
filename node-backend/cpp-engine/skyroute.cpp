#include <iostream>
#include <map>
#include <vector>
#include <queue>
#include <climits>
#include <string>
#include <algorithm>
using namespace std;

typedef pair<int, string> pii;

map<string, map<string, int>> graph = {
    {"Delhi", {{"Mumbai", 1400}, {"Jaipur", 280}, {"Lucknow", 500}, {"Ahmedabad", 950}, {"Kolkata", 1500}, {"Bangalore", 1700}}},
    {"Mumbai", {{"Delhi", 1400}, {"Pune", 150}, {"Goa", 580}, {"Ahmedabad", 530}, {"Bangalore", 840}}},
    {"Bangalore", {{"Mumbai", 840}, {"Hyderabad", 570}, {"Chennai", 350}, {"Goa", 560}, {"Delhi", 1700}}},
    {"Hyderabad", {{"Bangalore", 570}, {"Chennai", 630}, {"Pune", 560}}},
    {"Chennai", {{"Bangalore", 350}, {"Hyderabad", 630}, {"Cochin", 680}}},
    {"Kolkata", {{"Delhi", 1500}, {"Bhubaneswar", 440}, {"Guwahati", 970}}},
    {"Ahmedabad", {{"Mumbai", 530}, {"Delhi", 950}, {"Indore", 400}}},
    {"Pune", {{"Mumbai", 150}, {"Hyderabad", 560}}},
    {"Jaipur", {{"Delhi", 280}, {"Lucknow", 580}}},
    {"Goa", {{"Mumbai", 580}, {"Bangalore", 560}, {"Cochin", 720}}},
    {"Lucknow", {{"Delhi", 500}, {"Jaipur", 580}}},
    {"Cochin", {{"Chennai", 680}, {"Goa", 720}}},
    {"Bhubaneswar", {{"Kolkata", 440}}},
    {"Guwahati", {{"Kolkata", 970}}},
    {"Indore", {{"Ahmedabad", 400}}}
};


int main(int argc, char* argv[]) {
    if (argc < 3) {
        cout << "Error";
        return 0;
    }

    string start = argv[1];
    string end = argv[2];

    map<string, int> dist;
    map<string, string> parent;

    for (auto &node : graph) {
        dist[node.first] = INT_MAX;
    }

    priority_queue<pii, vector<pii>, greater<pii>> pq;
    dist[start] = 0;
    pq.push({0, start});

    while (!pq.empty()) {
        pii top = pq.top();
        pq.pop();

        int d = top.first;
        string u = top.second;

        for (auto &edge : graph[u]) {
            string v = edge.first;
            int w = edge.second;

            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                parent[v] = u;
                pq.push({dist[v], v});
            }
        }
    }

    if (dist[end] == INT_MAX) {
        cout << "No route";
        return 0;
    }


    vector<string> path;
    string current = end;

    while (current != start) {
        path.push_back(current);
        current = parent[current];
    }
    path.push_back(start);

    reverse(path.begin(), path.end());

    
    for (int i = 0; i < path.size(); i++) {
        cout << path[i];
        if (i != path.size() - 1)
            cout << ",";
    }

    cout << "|" << dist[end];

    return 0;
}
